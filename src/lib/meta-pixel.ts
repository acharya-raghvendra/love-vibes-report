// Meta Pixel — single source of truth for the pixel ID and every fbq call.
// The ID is our existing account-wide pixel, shared with the numerology site.
export const META_PIXEL_ID = "933965172294987";

// Every funnel event is tagged with this so love-match traffic is separable
// from the other products sharing the pixel.
export const CONTENT_NAME = "love_match_report";

type FbqParams = Record<string, unknown>;

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fn === "function" ? fn : null;
}

/** The inline bootstrap snippet, including init + the first PageView. */
export const metaPixelBootstrap = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');
`.trim();

export const metaPixelNoscriptSrc = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;

export function trackPageView(): void {
  fbq()?.("track", "PageView");
}

function flagKey(event: string, key: string): string {
  return `fb:${event}:${key}`;
}

function alreadyFired(event: string, key: string): boolean {
  try {
    return sessionStorage.getItem(flagKey(event, key)) === "1";
  } catch {
    return false;
  }
}

function markFired(event: string, key: string): void {
  try {
    sessionStorage.setItem(flagKey(event, key), "1");
  } catch {
    /* private mode — worst case the event repeats */
  }
}

/**
 * Fire a standard event at most once per session for the given key. Guards
 * against re-renders, refreshes and back/forward navigation re-firing it.
 */
export function trackOnce(
  event: string,
  key: string,
  params: FbqParams = {},
  options?: { eventID?: string },
): void {
  const f = fbq();
  if (!f || !key) return;
  if (alreadyFired(event, key)) return;
  markFired(event, key);
  if (options) f("track", event, { content_name: CONTENT_NAME, ...params }, options);
  else f("track", event, { content_name: CONTENT_NAME, ...params });
}

async function sha256Hex(value: string): Promise<string | null> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** Meta spec: email trimmed + lowercased; phone digits only, with country code. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `91${last10}` : digits;
}

/**
 * Re-init the pixel with hashed advanced-matching parameters. Raw email and
 * phone never reach fbq — only SHA-256 hex digests.
 */
export async function initAdvancedMatching(user: {
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  const f = fbq();
  if (!f) return;
  const email = user.email?.trim().toLowerCase();
  const phone = user.phone ? normalisePhone(user.phone) : "";
  const [em, ph] = await Promise.all([
    email ? sha256Hex(email) : Promise.resolve(null),
    phone ? sha256Hex(phone) : Promise.resolve(null),
  ]);
  const data: FbqParams = {};
  if (em) data.em = em;
  if (ph) data.ph = ph;
  if (Object.keys(data).length === 0) return;
  f("init", META_PIXEL_ID, data);
}
