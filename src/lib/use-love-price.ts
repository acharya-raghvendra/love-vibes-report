import { useEffect, useState } from "react";

// Live price for the marketing price lines. Never renders a partial string:
// callers get "loading" (render a placeholder) or "error" (hide the line).
export type PriceState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; listPrice: number; finalPrice: number };

let memo: { listPrice: number; finalPrice: number } | null = null;

export function useLovePrice(): PriceState {
  const [state, setState] = useState<PriceState>(
    memo ? { status: "ready", ...memo } : { status: "loading" }
  );

  useEffect(() => {
    if (memo) {
      setState({ status: "ready", ...memo });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/public/love-match-price");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { listPrice?: number; finalPrice?: number };
        if (typeof json.finalPrice !== "number" || typeof json.listPrice !== "number") {
          throw new Error("bad payload");
        }
        memo = { listPrice: json.listPrice, finalPrice: json.finalPrice };
        if (alive) setState({ status: "ready", ...memo });
      } catch {
        if (alive) setState({ status: "error" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
