import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FAMILIES = [
  { family: "Noto Sans Tamil", slug: "tamil" },
  { family: "Noto Sans Telugu", slug: "telugu" },
  { family: "Noto Sans Kannada", slug: "kannada" },
  { family: "Noto Sans Malayalam", slug: "malayalam" },
] as const;

const WEIGHTS = [400, 600] as const;

function createAuthenticatedClient(url: string, key: string, authorization: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: authorization },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        headers.set("Authorization", authorization);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function parseWoff2Urls(css: string, weight: number): string[] {
  const blocks = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  const urls: string[] = [];
  for (const block of blocks) {
    if (!new RegExp(`font-weight:\\s*${weight}\\s*;`).test(block)) continue;
    const source = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)\s*format\(['"]woff2['"]\)/);
    if (source?.[1]) urls.push(source[1]);
  }
  if (urls.length === 0) throw new Error(`woff2 sources not found for weight ${weight}`);
  return urls;
}

async function fetchLargestWoff2(urls: string[], label: string): Promise<Uint8Array> {
  const candidates = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) throw new Error(`${label} download failed (${response.status})`);
      return new Uint8Array(await response.arrayBuffer());
    }),
  );
  return candidates.reduce((largest, candidate) =>
    candidate.byteLength > largest.byteLength ? candidate : largest
  );
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((value, index) => value === b[index]);
}

export const Route = createFileRoute("/api/seed-indic-fonts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !publishableKey) throw new Error("Cloud authentication configuration is missing");

        const userClient = createAuthenticatedClient(url, publishableKey, authorization);
        const { data: userData, error: userError } = await userClient.auth.getUser();
        if (userError || !userData.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        if (roleError || !isAdmin) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const selected = new Map<string, Uint8Array>();

        for (const config of FAMILIES) {
          for (const weight of WEIGHTS) {
            const familyQuery = config.family.replaceAll(" ", "+");
            const cssResponse = await fetch(
              `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@${weight}&display=swap`,
              { headers: { "User-Agent": USER_AGENT } },
            );
            const css = await cssResponse.text();
            if (!cssResponse.ok) {
              throw new Error(`${config.family} ${weight} CSS fetch failed (${cssResponse.status}): ${css.slice(0, 200)}`);
            }
            const bytes = await fetchLargestWoff2(parseWoff2Urls(css, weight), `${config.family} ${weight}`);
            const filename = `noto-sans-${config.slug}-${weight}.woff2`;
            if (bytes.byteLength < 5000) throw new Error(`${filename} is too small: ${bytes.byteLength} bytes`);
            selected.set(filename, bytes);
          }

          const regularName = `noto-sans-${config.slug}-400.woff2`;
          const semiboldName = `noto-sans-${config.slug}-600.woff2`;
          const regular = selected.get(regularName);
          const semibold = selected.get(semiboldName);
          if (!regular || !semibold) throw new Error(`${config.family} weight selection incomplete`);
          if (bytesEqual(regular, semibold)) throw new Error(`${config.family} 400 and 600 files are byte-identical`);
        }

        const uploaded: Array<{ filename: string; bytes: number }> = [];
        for (const [filename, bytes] of selected) {
          const { error: uploadError } = await supabaseAdmin.storage
            .from("report-fonts")
            .upload(filename, bytes, { upsert: true, contentType: "font/woff2" });
          if (uploadError) throw new Error(`${filename} upload failed: ${uploadError.message}`);
          console.log(`[seed-indic-fonts] ${filename} ${bytes.byteLength} bytes`);
          uploaded.push({ filename, bytes: bytes.byteLength });
        }

        return Response.json({ ok: true, uploaded });
      },
    },
  },
});
