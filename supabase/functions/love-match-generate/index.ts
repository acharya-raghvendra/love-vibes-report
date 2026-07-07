// love-match-generate — preview compute (engine math only, no Gemini).
// Returns score + band + facts. Cached. Free-tier traffic.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scoreMatch } from "../_shared/engine/scorer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

type ErrorCode = "INVALID_REQUEST" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
const ERROR_STATUS: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
};

function errorResponse(code: ErrorCode, detail?: string): Response {
  return new Response(
    JSON.stringify({ error: { code, message: detail ?? code, status: ERROR_STATUS[code] } }),
    { status: ERROR_STATUS[code], headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function successResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- Input sanitation ----
function cleanName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[<>]/g, "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60);
}

function validDob(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map((n) => parseInt(n, 10));
  if (y < 1900 || y > new Date().getUTCFullYear()) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > Date.now()) return null; // no future DOB
  return raw;
}

interface Person { first: string; last: string; dob: string; }

function validatePerson(p: unknown, who: string): { ok: true; value: Person } | { ok: false; error: string } {
  if (!p || typeof p !== "object") return { ok: false, error: `${who} is required.` };
  const o = p as Record<string, unknown>;
  const first = cleanName(o.first);
  const last = cleanName(o.last); // optional
  if (!first) return { ok: false, error: `${who}.first is required.` };
  const dob = validDob(o.dob);
  if (!dob) return { ok: false, error: `${who}.dob must be a real past date in YYYY-MM-DD.` };
  return { ok: true, value: { first, last, dob } };
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cache key: normalized so "Rohit" / " rohit " collide. refYear included
// because Personal Year changes the output each calendar year.
async function cacheKey(a: Person, b: Person, refYear: number): Promise<string> {
  const norm = (p: Person) => `${p.first.toLowerCase()}|${p.last.toLowerCase()}|${p.dob}`;
  // Order-independent: same couple regardless of who is A/B.
  const parts = [norm(a), norm(b)].sort();
  return await sha256(`lovematch:v1:${refYear}:${parts.join("::")}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const orderId = crypto.randomUUID();

  try {
    let body: unknown;
    try { body = await req.json(); } catch { return errorResponse("INVALID_REQUEST", "Body must be JSON."); }
    const b = body as Record<string, unknown>;
    const input = (b.input_data ?? b) as Record<string, unknown>;

    const va = validatePerson(input.person_a, "person_a");
    if (!va.ok) return errorResponse("VALIDATION_ERROR", va.error);
    const vb = validatePerson(input.person_b, "person_b");
    if (!vb.ok) return errorResponse("VALIDATION_ERROR", vb.error);

    const language = (input.locale as string) || (input.language as string) || "en";
    const refYear = new Date().getUTCFullYear();

    const key = await cacheKey(va.value, vb.value, refYear);

    // Cache read (best-effort; never blocks on failure).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    try {
      const { data: cached } = await supabase
        .from("love_match_cache").select("payload").eq("cache_key", key).maybeSingle();
      if (cached?.payload) {
        return successResponse({ ...cached.payload, order_id: orderId, cached: true });
      }
    } catch (_) { /* cache miss path continues */ }

    const result = scoreMatch(
      va.value.first, va.value.last, va.value.dob,
      vb.value.first, vb.value.last, vb.value.dob,
      refYear,
    );

    // Rule-based Chemistry teaser (no Gemini in preview).
    const chem = result.breakdown;
    const chemAvg = Math.round(
      chem.reduce((s, p) => s + p.points, 0) / chem.length,
    );
    const chemTeaser =
      chemAvg >= 80 ? "strong_pull"
      : chemAvg >= 55 ? "warm_spark"
      : chemAvg >= 40 ? "slow_burn"
      : "opposites_tension";

    const payload = {
      order_id: orderId,
      product_code: "LOVE_MATCH",
      status: "completed",
      generated_at: new Date().toISOString(),
      language,
      // PREVIEW SCOPE ONLY. Full facts + prose are generated post-payment
      // in love-match-finalize, which recomputes deterministically.
      data: {
        score: result.score,
        band: result.band,
        shared: result.shared,
        chemistry_teaser: {
          level: chemTeaser,
          planet_pairs: chem.map((p) => ({ key: p.key, a: p.aScore, b: p.bScore })),
        },
        names: { a: va.value.first, b: vb.value.first },
      },
    };

    // Cache write (best-effort).
    try {
      await supabase.from("love_match_cache").upsert({ cache_key: key, payload });
    } catch (_) { /* non-fatal */ }

    return successResponse(payload);
  } catch (_err) {
    // Never leak internals.
    return errorResponse("INTERNAL_ERROR", "An internal error occurred.");
  }
});
