// Run: deno test --allow-env supabase/functions/_shared/gatewayAuth_test.ts
// The signer below mirrors the gateway's ttgSign.ts (same message format).
import { strictEqual } from "node:assert";
import { signedMessage, verifyGatewayRequest } from "./gatewayAuth.ts";

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)));
const b64url = (b: ArrayBuffer) => b64(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sha = async (t: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), (x) => x.toString(16).padStart(2, "0")).join("");

const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
const PUB = b64(await crypto.subtle.exportKey("spki", pair.publicKey));
const NOW = 1_792_000_000;
const URL_GEN = "https://esnkelpdgqoqnlfleflk.supabase.co/functions/v1/generate-report";

async function signed(url: string, method: string, body: string, ts = NOW, key = pair.privateKey, servedUrl?: string) {
  const u = new URL(url);
  const sig = await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedMessage(ts, method, u.pathname + u.search, await sha(body))));
  return new Request(servedUrl ?? url, { method, headers: { "x-ttg-ts": String(ts), "x-ttg-sig": b64url(sig) }, body: method === "GET" ? undefined : body });
}
const check = (req: Request, body: string, nowSec = NOW) => verifyGatewayRequest(req, body, { nowSec, publicKeySpki: PUB });

Deno.test("valid POST signature is accepted", async () => {
  const body = '{"full_name":"x"}';
  strictEqual((await check(await signed(URL_GEN, "POST", body), body)).ok, true);
});

Deno.test("valid GET signature with query is accepted", async () => {
  const url = "https://esnkelpdgqoqnlfleflk.supabase.co/functions/v1/get-report-job?job_id=0dd0bcd5-5962-43cf-b973-a1cb8d354837";
  strictEqual((await check(await signed(url, "GET", ""), "")).ok, true);
});

Deno.test("accepted when the runtime serves the function without the /functions/v1 prefix", async () => {
  const body = "{}";
  const req = await signed(URL_GEN, "POST", body, NOW, pair.privateKey, "http://edge-runtime.internal/generate-report");
  strictEqual((await check(req, body)).ok, true);
});

Deno.test("unsigned request is refused", async () => {
  const r = await check(new Request(URL_GEN, { method: "POST", body: "{}" }), "{}");
  strictEqual(r.ok === false && r.reason, "missing_signature");
});

Deno.test("tampered body is refused", async () => {
  const req = await signed(URL_GEN, "POST", '{"a":1}');
  const r = await check(req, '{"a":2}');
  strictEqual(r.ok === false && r.reason, "invalid_signature");
});

Deno.test("other job id is refused (query is signed)", async () => {
  const signedReq = await signed("https://h/functions/v1/get-report-job?job_id=a", "GET", "");
  const forged = new Request("https://h/functions/v1/get-report-job?job_id=b", { headers: signedReq.headers });
  const r = await check(forged, "");
  strictEqual(r.ok === false && r.reason, "invalid_signature");
});

Deno.test("stale timestamp (>5 min) is refused", async () => {
  const req = await signed(URL_GEN, "POST", "{}", NOW - 301);
  const r = await check(req, "{}");
  strictEqual(r.ok === false && r.reason, "stale_timestamp");
});

Deno.test("signature from a different key is refused", async () => {
  const other = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const req = await signed(URL_GEN, "POST", "{}", NOW, other.privateKey);
  const r = await check(req, "{}");
  strictEqual(r.ok === false && r.reason, "invalid_signature");
});
