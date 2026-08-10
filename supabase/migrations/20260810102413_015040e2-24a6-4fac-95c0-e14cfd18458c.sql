DROP POLICY IF EXISTS "Affiliates can read own coupon orders" ON public.love_match_orders;

CREATE OR REPLACE VIEW public.affiliate_order_sales
WITH (security_invoker = off) AS
SELECT
  o.order_id,
  o.coupon_code,
  o.final_price,
  o.discount_applied,
  o.status,
  o.created_at,
  o.ready_at,
  o.delivered_at
FROM public.love_match_orders o
WHERE o.coupon_code IS NOT NULL
  AND public.is_affiliate_of_coupon(o.coupon_code);

ALTER VIEW public.affiliate_order_sales OWNER TO postgres;

REVOKE ALL ON public.affiliate_order_sales FROM PUBLIC;
REVOKE ALL ON public.affiliate_order_sales FROM anon;
GRANT SELECT ON public.affiliate_order_sales TO authenticated;
GRANT SELECT ON public.affiliate_order_sales TO service_role;