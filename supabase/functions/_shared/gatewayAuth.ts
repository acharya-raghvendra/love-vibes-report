// Only the TalkToGuruji gateway (numerology-api) may call partner-generate-full
// (the paid Love Match PDF). Until 2026-10-18 it answered anyone holding the
// public anon key, at our Gemini + Browserless cost (copied from the career
// engine, where the same hole was proven). The gateway signs each call with an Ed25519
// private key held only in its secrets; this file verifies the signature with
// the matching PUBLIC key, which is not secret and can live in code.
//
// Signed message: `${ts}.${METHOD}.${pathname+search}.${sha256hex(body)}`
// Headers: x-ttg-ts (unix seconds), x-ttg-sig (base64url signature).
// Keep in step with talktoguruji-deploy/.../numerology-api/ttgSign.ts.

// SPKI DER, base64. Override with GATEWAY_PUBLIC_KEY to rotate without a code change.
export const GATEWAY_PUBLIC_KEY_SPKI = "MCowBQYDK2VwAyEAcC4cpETE/ylMiJ0+icXMPaX7omDCsbNkSVPUa0CGllo=";

const MAX_SKEW_SEC = 300;

let keyPromise: Promise<CryptoKey | null> | null = null;

function b64ToBytes(b64: string): Uint8Array {
  const norm = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function sha256hex(text: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function signedMessage(ts: number, method: string, pathAndQuery: string, bodyHash: string): string {
  return `${ts}.${method.toUpperCase()}.${pathAndQuery}.${bodyHash}`;
}

function loadKey(spkiB64?: string): Promise<CryptoKey | null> {
  if (spkiB64) {
    return crypto.subtle.importKey("spki", b64ToBytes(spkiB64) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
  }
  if (!keyPromise) {
    const b64 = Deno.env.get("GATEWAY_PUBLIC_KEY") || GATEWAY_PUBLIC_KEY_SPKI;
    keyPromise = crypto.subtle
      .importKey("spki", b64ToBytes(b64) as BufferSource, { name: "Ed25519" }, false, ["verify"])
      .catch((e) => {
        console.error("gateway_auth_key_import_failed", e instanceof Error ? e.message : String(e));
        return null;
      });
  }
  return keyPromise;
}

export type GatewayAuthResult = { ok: true } | { ok: false; reason: string };

/**
 * Verify a request. Pass the raw body text exactly as received ("" for GET).
 * The pathname is taken from the request URL; Supabase may serve functions
 * under /functions/v1/<name> or /<name>, so both are accepted.
 */
export async function verifyGatewayRequest(
  req: Request,
  rawBody: string,
  opts: { nowSec?: number; publicKeySpki?: string } = {},
): Promise<GatewayAuthResult> {
  const tsRaw = req.headers.get("x-ttg-ts");
  const sigRaw = req.headers.get("x-ttg-sig");
  if (!tsRaw || !sigRaw) return { ok: false, reason: "missing_signature" };
  const ts = Number(tsRaw);
  if (!Number.isInteger(ts)) return { ok: false, reason: "bad_timestamp" };
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_SKEW_SEC) return { ok: false, reason: "stale_timestamp" };

  const key = await loadKey(opts.publicKeySpki);
  if (!key) return { ok: false, reason: "no_key" };

  let sig: Uint8Array;
  try { sig = b64ToBytes(sigRaw); } catch { return { ok: false, reason: "bad_signature_encoding" }; }

  const u = new URL(req.url);
  const bodyHash = await sha256hex(rawBody);
  const fn = u.pathname.replace(/^\/functions\/v1/, "");
  const candidates = new Set([u.pathname + u.search, "/functions/v1" + fn + u.search]);
  for (const path of candidates) {
    const msg = new TextEncoder().encode(signedMessage(ts, req.method, path, bodyHash));
    if (await crypto.subtle.verify("Ed25519", key, sig as BufferSource, msg as BufferSource)) return { ok: true };
  }
  return { ok: false, reason: "invalid_signature" };
}
