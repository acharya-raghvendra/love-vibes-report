CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupon_codes
  SET usage_count = usage_count + 1
  WHERE code = _code;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_usage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(text) FROM anon;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO service_role;