import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import faviconAsset from "../assets/favicon.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { metaPixelBootstrap, metaPixelNoscriptSrc, trackPageView } from "../lib/meta-pixel";
import { DEFAULT_LANGUAGE, langFromPath } from "../lib/site-language";
import { SiteHeader } from "../components/site-header";

import { SiteFooter } from "../components/site-footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Love Match — Numerology Compatibility Report" },
      { name: "description", content: "Discover if your souls are aligned. A cosmic numerology compatibility report revealing your destiny numbers, soul urges, and shared path." },
      { property: "og:title", content: "Love Match — Numerology Compatibility Report" },
      { property: "og:description", content: "Discover if your souls are aligned by the numbers. Ancient Vedic numerology, decoded for modern seekers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Love Match — Numerology Compatibility Report" },
      { name: "twitter:description", content: "Discover if your souls are aligned by the numbers." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: faviconAsset.url, type: "image/png" },
      { rel: "apple-touch-icon", href: faviconAsset.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Devanagari: only the two weights actually used (400 body, 600 headings),
      // with display=swap so heavy Indic files never block first paint on mobile.
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Serif+Devanagari:wght@600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // <html lang> follows the URL prefix so screen readers and crawlers see the
  // language of the page that was actually requested.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <html lang={langFromPath(pathname) ?? DEFAULT_LANGUAGE} className="dark">
      <head>
        <HeadContent />
        {/* Meta Pixel base code — loads once for every page (async script). */}
        <script async dangerouslySetInnerHTML={{ __html: metaPixelBootstrap }} />
      </head>
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={metaPixelNoscriptSrc}
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Client-side routing means the base snippet's PageView only covers the first
 * route. Fire one PageView per subsequent navigation, skipping the initial
 * resolve so it is never counted twice.
 */
function usePixelRouteTracking() {
  const router = useRouter();
  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    // The base snippet already fired PageView for the URL we mounted on.
    if (lastTracked.current === null) {
      const l = router.state.location;
      lastTracked.current = l.pathname + (l.searchStr ?? "");
    }
    return router.subscribe("onResolved", ({ toLocation }) => {
      const href = toLocation.pathname + (toLocation.searchStr ?? "");
      if (href === lastTracked.current) return;
      lastTracked.current = href;
      trackPageView();
    });
  }, [router]);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboard = pathname.startsWith("/dashboard");
  usePixelRouteTracking();

  return (
    <QueryClientProvider client={queryClient}>
      {!isDashboard && <SiteHeader />}
      <Outlet />
      {!isDashboard && <SiteFooter />}
    </QueryClientProvider>
  );
}

