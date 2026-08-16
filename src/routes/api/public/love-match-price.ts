import { createFileRoute } from "@tanstack/react-router";

// Public, read-only live price for the landing / input price lines.
// Single source of truth: love_match_pricing (same table the coupon +
// order-creation paths read). No PII, no coupon logic here.

type PriceBody = { listPrice: number; finalPrice: number };

const TTL_MS = 45_000;
let cache: { at: number; body: PriceBody } | null = null;

function ok(body: PriceBody) {
  return Response.json(body, {
    headers: {
      // Small shared cache so a traffic spike is not one DB read per visitor.
      "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export const Route = createFileRoute("/api/public/love-match-price")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && Date.now() - cache.at < TTL_MS) return ok(cache.body);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("love_match_pricing")
            .select("list_price, offer_price, offer_ends_at")
            .limit(1)
            .maybeSingle();

          if (!data || typeof data.list_price !== "number") {
            return Response.json({ error: "unavailable" }, { status: 503 });
          }

          const offerLive = data.offer_ends_at
            ? new Date(data.offer_ends_at) > new Date()
            : true;
          const body: PriceBody = {
            listPrice: data.list_price,
            finalPrice:
              offerLive && typeof data.offer_price === "number"
                ? data.offer_price
                : data.list_price,
          };
          cache = { at: Date.now(), body };
          return ok(body);
        } catch (err) {
          console.error("[love-match-price] failed", err);
          return Response.json({ error: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
