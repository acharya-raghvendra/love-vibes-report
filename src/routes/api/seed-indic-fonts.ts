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

function parseWoff2Url(css: string, weight: number): string {
  const blocks = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  for (const block of blocks) {
    if (!new RegExp(`font-weight:\\s*${weight}\\s*;`).test(block)) continue;
    const source = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)\s*format\(['"]woff2['"]\)/);
    if (source?.[1]) return source[1];
  }
  throw new Error(`woff2 source not found for weight ${weight}`);
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
        const uploaded: Array<{ filename: string; bytes: number }> = [];

        for (const config of FAMILIES) {
          const familyQuery = config.family.replaceAll(" ", "+");
          const cssResponse = await fetch(
            `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@400;600&display=swap`,
            { headers: { "User-Agent": USER_AGENT } },
          );
          const css = await cssResponse.text();
          if (!cssResponse.ok) {
            throw new Error(`${config.family} CSS fetch failed (${cssResponse.status}): ${css.slice(0, 200)}`);
          }

          for (const weight of WEIGHTS) {
            const fontUrl = parseWoff2Url(css, weight);
            const fontResponse = await fetch(fontUrl, { headers: { "User-Agent": USER_AGENT } });
            if (!fontResponse.ok) {
              throw new Error(`${config.family} ${weight} download failed (${fontResponse.status})`);
            }

            const bytes = new Uint8Array(await fontResponse.arrayBuffer());
            const filename = `noto-sans-${config.slug}-${weight}.woff2`;
            if (bytes.byteLength < 5000) {
              throw new Error(`${filename} is too small: ${bytes.byteLength} bytes`);
            }

            const { error: uploadError } = await supabaseAdmin.storage
              .from("report-fonts")
              .upload(filename, bytes, { upsert: true, contentType: "font/woff2" });
            if (uploadError) throw new Error(`${filename} upload failed: ${uploadError.message}`);

            console.log(`[seed-indic-fonts] ${filename} ${bytes.byteLength} bytes`);
            uploaded.push({ filename, bytes: bytes.byteLength });
          }
        }

        return Response.json({ ok: true, uploaded });
      },
    },
  },
});