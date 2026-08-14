// Ops alerting over the existing Resend integration.
//
// Used for money-safety anomalies that must never be silent: a captured
// payment whose amount does not match what we charged, or an order that
// reached payment without a recorded price. Never throws — alerting must
// not be able to break a webhook.

const OPS_ALERT_TO = "info@talktoguruji.com";
const OPS_ALERT_FROM = "TalkToGuruji <alerts@update.talktoguruji.com>";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fire-and-forget ops email. Returns whether Resend accepted it. */
export async function sendOpsAlert(args: {
  subject: string;
  lines: Array<[string, string]>;
  note?: string;
}): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[alert] resend_key_missing — cannot send ops alert");
    return false;
  }

  const rows = args.lines
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;font-size:13px;">${escapeHtml(k)}</td>` +
        `<td style="padding:4px 0;font-size:13px;"><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1c1b1f;">
  <h2 style="margin:0 0 12px;font-size:18px;">${escapeHtml(args.subject)}</h2>
  ${args.note ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${escapeHtml(args.note)}</p>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>
  <p style="margin:20px 0 0;font-size:12px;color:#6b6b6b;">Automated alert from the Love Match payment pipeline.</p>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: OPS_ALERT_FROM,
        to: [OPS_ALERT_TO],
        subject: args.subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[alert] resend status=${res.status} ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[alert] send failed: ${err instanceof Error ? err.message : "unknown"}`);
    return false;
  }
}
