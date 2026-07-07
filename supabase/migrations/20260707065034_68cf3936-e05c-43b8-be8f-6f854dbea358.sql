
ALTER TABLE public.love_match_orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
CREATE INDEX IF NOT EXISTS love_match_orders_status_idx ON public.love_match_orders (status);
CREATE INDEX IF NOT EXISTS love_match_orders_razorpay_idx ON public.love_match_orders (razorpay_order_id);

CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','flat')),
  discount_amount integer NOT NULL CHECK (discount_amount > 0),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.coupon_codes TO service_role;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
-- No policies: only service-role backend (edge functions) accesses this table.
