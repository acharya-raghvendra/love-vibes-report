// Server-only helpers for driving the Love Match report pipeline from
// TanStack server routes. The pipeline itself lives in the edge function
// (supabase/functions/_shared/generate-report.ts) — these helpers just
// authorise and trigger it.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Ask Razorpay whether the gateway order was actually paid. */
export async function isRazorpayOrderPaid(razorpayOrderId: string | null): Promise<boolean> {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret || !razorpayOrderId) return false;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    });
    if (!res.ok) return false;
    const order = (await res.json()) as { status?: string; amount_paid?: number };
    return order?.status === "paid" || (order?.amount_paid ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Trigger generation for one order through the shared pipeline.
 * Presents the service-role key as the internal caller credential.
 * Callers MUST verify eligibility (paid + failed/stuck) first.
 */
export async function triggerGeneration(
  orderId: string,
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; status?: string; skipped?: string; error?: string }> {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) return { ok: false, error: "config" };
  try {
    const res = await fetch(`${url}/functions/v1/admin-retry-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": serviceKey,
        apikey: serviceKey,
      },
      body: JSON.stringify({ order_id: orderId, force: opts.force ?? false }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      skipped?: string;
      error?: string;
    };
    if (!res.ok) return { ok: false, error: data.error ?? `http_${res.status}` };
    return { ok: data.status !== "failed", status: data.status, skipped: data.skipped, error: data.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" };
  }
}
