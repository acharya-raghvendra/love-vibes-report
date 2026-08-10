ALTER TABLE public.love_match_orders
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS love_match_orders_razorpay_order_id_idx
  ON public.love_match_orders (razorpay_order_id);

CREATE INDEX IF NOT EXISTS love_match_orders_status_created_at_idx
  ON public.love_match_orders (status, created_at DESC);