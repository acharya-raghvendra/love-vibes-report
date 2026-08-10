ALTER TABLE public.love_match_orders
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;