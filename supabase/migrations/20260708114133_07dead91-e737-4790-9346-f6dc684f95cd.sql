-- 1. Fix the discount_type constraint (percentage/flat -> percentage/fixed)
ALTER TABLE public.coupon_codes DROP CONSTRAINT IF EXISTS coupon_codes_discount_type_check;
ALTER TABLE public.coupon_codes ADD CONSTRAINT coupon_codes_discount_type_check
  CHECK (discount_type IN ('percentage', 'fixed'));

-- 2. Add affiliate columns
ALTER TABLE public.coupon_codes
  ADD COLUMN IF NOT EXISTS affiliate_user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS coupon_codes_affiliate_user_id_idx
  ON public.coupon_codes(affiliate_user_id);

-- 3. Security-definer helper: is the current user the affiliate on a given coupon code?
CREATE OR REPLACE FUNCTION public.is_affiliate_of_coupon(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coupon_codes
    WHERE code = _code
      AND affiliate_user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.is_affiliate_of_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_affiliate_of_coupon(text) TO authenticated, service_role;

-- 4. Affiliate RLS: can SELECT their own coupons
DROP POLICY IF EXISTS "Affiliates can read own coupons" ON public.coupon_codes;
CREATE POLICY "Affiliates can read own coupons"
ON public.coupon_codes
FOR SELECT
TO authenticated
USING (affiliate_user_id = auth.uid());

-- 5. Affiliate RLS: can SELECT orders placed with their coupons
DROP POLICY IF EXISTS "Affiliates can read own coupon orders" ON public.love_match_orders;
CREATE POLICY "Affiliates can read own coupon orders"
ON public.love_match_orders
FOR SELECT
TO authenticated
USING (coupon_code IS NOT NULL AND public.is_affiliate_of_coupon(coupon_code));