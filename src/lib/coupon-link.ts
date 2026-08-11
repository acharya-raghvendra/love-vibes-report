// Coupon persistence across the funnel: / -> /input -> /preview.
// The URL is the source of truth (affiliate links look like /?coupon=CODE);
// sessionStorage is only a mirror so a refresh or a lost query param does not
// drop the code. The server always re-validates the code and recomputes the
// price, so nothing here can grant a discount on its own.

const STORAGE_KEY = "loveMatch:coupon";
const MAX_LEN = 40;
const CODE_RE = /^[A-Z0-9_-]{2,}$/;

/** Trim + uppercase + shape check. Returns null for anything unusable. */
export function normalizeCoupon(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase().slice(0, MAX_LEN);
  return CODE_RE.test(code) ? code : null;
}

/** validateSearch helper: keeps `coupon` only when it looks like a code. */
export function validateCouponSearch(search: Record<string, unknown>): { coupon?: string } {
  const code = normalizeCoupon(search["coupon"]);
  return code ? { coupon: code } : {};
}

export function storeCoupon(code: string | null): void {
  try {
    if (code) sessionStorage.setItem(STORAGE_KEY, code);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked — URL still carries the code */
  }
}

export function readStoredCoupon(): string | null {
  try {
    return normalizeCoupon(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * URL coupon wins and refreshes the mirror. When the URL has none:
 * `clearWhenAbsent` (entry page) drops any stale stored code, otherwise the
 * mirror is used as a fallback so mid-funnel navigation cannot lose it.
 */
export function resolveCoupon(
  urlCoupon: string | undefined,
  opts: { clearWhenAbsent?: boolean } = {},
): string | null {
  const fromUrl = normalizeCoupon(urlCoupon);
  if (fromUrl) {
    storeCoupon(fromUrl);
    return fromUrl;
  }
  if (opts.clearWhenAbsent) {
    storeCoupon(null);
    return null;
  }
  return readStoredCoupon();
}

/** Search object for links/navigation: `{ coupon }` or `{}`. */
export function couponSearch(code: string | null): { coupon?: string } {
  return code ? { coupon: code } : {};
}
