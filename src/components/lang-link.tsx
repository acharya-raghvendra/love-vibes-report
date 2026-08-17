import { Link } from "@tanstack/react-router";
import { forwardRef, type ComponentProps } from "react";

type LinkProps = ComponentProps<typeof Link>;

/**
 * Link to a runtime-computed language path (English = unprefixed, Hindi = /hi).
 * The target is only known at runtime, so the literal-path typing of `Link`
 * is bypassed while every other prop stays typed.
 */
export const LangLink = forwardRef<
  HTMLAnchorElement,
  Omit<LinkProps, "to" | "params" | "search"> & {
    to: string;
    search?: Record<string, unknown>;
  }
>(function LangLink({ to, search, ...rest }, ref) {
  return <Link ref={ref} to={to as never} search={search as never} {...rest} />;
});
