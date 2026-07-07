import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Payment Successful — Love Match" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="nebula-glow absolute top-[-10%] right-[-10%] h-[70vw] w-[70vw] rounded-full bg-tertiary" />
        <div
          className="nebula-glow absolute bottom-[-10%] left-[-10%] h-[55vw] w-[55vw] rounded-full bg-primary-container"
          style={{ animationDelay: "-8s" }}
        />
      </div>
      <main className="relative mx-auto flex min-h-screen max-w-[560px] items-center justify-center px-margin-mobile py-24 lg:px-6">
        <div className="glass-card w-full rounded-3xl border border-primary/25 p-8 text-center shadow-2xl lg:p-12">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: "4rem" }}
          >
            check_circle
          </span>
          <h1 className="mt-4 font-headline-sm text-headline-sm text-on-surface lg:text-headline-md">
            Payment Received
          </h1>
          <p className="mt-3 font-body-md text-on-surface-variant">
            Your full compatibility report is being prepared. We'll send it to your WhatsApp shortly.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary-fixed"
          >
            Return home
          </Link>
        </div>
      </main>
    </div>
  );
}
