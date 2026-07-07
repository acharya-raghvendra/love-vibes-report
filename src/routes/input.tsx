import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/input")({
  head: () => ({
    meta: [
      { title: "Enter Your Details — Love Match Compatibility" },
      {
        name: "description",
        content:
          "Share your birth details to reveal your cosmic numerology compatibility with your partner.",
      },
      { property: "og:title", content: "Enter Your Details — Love Match" },
      {
        property: "og:description",
        content: "Share your birth details to reveal your cosmic numerology compatibility.",
      },
    ],
  }),
  component: InputPage,
});

type Gender = "MALE" | "FEMALE";

function GenderToggle({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (v: Gender) => void;
}) {
  return (
    <div className="flex rounded-full border border-outline-variant/30 bg-surface-container/60 p-1">
      {(["MALE", "FEMALE"] as const).map((g) => {
        const active = value === g;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`flex-1 rounded-full py-2 font-label-md text-label-md transition-all ${
              active
                ? "bg-primary text-on-primary-fixed shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}

function PartnerCard({
  index,
  label,
  icon,
  name,
  setName,
  dob,
  setDob,
  gender,
  setGender,
}: {
  index: 1 | 2;
  label: string;
  icon: string;
  name: string;
  setName: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
}) {
  return (
    <div className="glass-card relative rounded-2xl border border-outline-variant/25 p-6 shadow-2xl lg:p-8">
      <span className="ornate-corner top-left" aria-hidden="true" />
      <span className="ornate-corner bottom-right" aria-hidden="true" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
          Partner {index}
        </h2>
        <span className="font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>

      <div className="space-y-6">
        <div className="group relative">
          <label className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant transition-colors group-focus-within:text-primary">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className="w-full border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-headline-sm text-headline-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="group relative">
            <label className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full border-0 border-b border-outline-variant bg-transparent px-0 py-2 font-body-lg text-body-lg text-on-surface outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant">
              Gender
            </label>
            <GenderToggle value={gender} onChange={setGender} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InputPage() {
  const navigate = useNavigate();
  const [p1Name, setP1Name] = useState("");
  const [p1Dob, setP1Dob] = useState("");
  const [p1Gender, setP1Gender] = useState<Gender>("MALE");
  const [p2Name, setP2Name] = useState("");
  const [p2Dob, setP2Dob] = useState("");
  const [p2Gender, setP2Gender] = useState<Gender>("FEMALE");
  const [phone, setPhone] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!p1Name.trim() || !p1Dob || !p2Name.trim() || !p2Dob || phone.replace(/\D/g, "").length < 10) return;

    const splitName = (n: string) => {
      const parts = n.trim().split(/\s+/);
      return { first: parts[0], last: parts.slice(1).join(" ") };
    };
    const a = splitName(p1Name);
    const b = splitName(p2Name);
    const payload = {
      person_a: { ...a, dob: p1Dob, gender: p1Gender, phone: phone.replace(/\D/g, "") },
      person_b: { ...b, dob: p2Dob, gender: p2Gender },
    };
    try {
      sessionStorage.setItem("loveMatch:input", JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    navigate({ to: "/preview" });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="nebula-glow absolute top-[-10%] right-[-10%] h-[70vw] w-[70vw] rounded-full bg-tertiary" />
        <div
          className="nebula-glow absolute bottom-[-10%] left-[-10%] h-[55vw] w-[55vw] rounded-full bg-primary-container"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <main className="relative mx-auto max-w-[800px] px-margin-mobile pt-28 pb-24 lg:pt-32 lg:pb-24 lg:px-6">
        <section className="mb-10 space-y-2 text-center">
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg">
            Enter Your <span className="text-gold-gradient">Details</span>
          </h1>
          <p className="font-body-lg text-body-lg mx-auto max-w-md text-on-surface-variant">
            Share your birth details to reveal your cosmic compatibility.
          </p>
        </section>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <PartnerCard
              index={1}
              label="Initiator"
              icon="person"
              name={p1Name}
              setName={setP1Name}
              dob={p1Dob}
              setDob={setP1Dob}
              gender={p1Gender}
              setGender={setP1Gender}
            />

            {/* Heart divider — mobile only (between stacked cards) */}
            <div className="flex items-center justify-center py-1 lg:hidden">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="relative px-6">
                <span
                  className="material-symbols-outlined animate-pulse text-primary"
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: "2rem" }}
                >
                  favorite
                </span>
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
            </div>

            <PartnerCard
              index={2}
              label="Companion"
              icon="person_2"
              name={p2Name}
              setName={setP2Name}
              dob={p2Dob}
              setDob={setP2Dob}
              gender={p2Gender}
              setGender={setP2Gender}
            />
          </div>

          {/* WhatsApp */}
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 p-6">
            <label className="mb-2 flex items-center gap-2 font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant">
              <span className="material-symbols-outlined text-base">chat</span>
              Receive Insights via WhatsApp
            </label>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-3 font-label-md text-on-surface-variant">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp Number"
                className="font-body-lg flex-1 rounded-lg border border-outline-variant/30 bg-surface-container px-4 py-3 text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <button
              type="submit"
              className="shimmer flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary-container to-primary py-5 text-lg font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              Check Compatibility
            </button>
          </div>

          {/* Trust */}
          <div className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">lock</span>
              100% Secure &amp; Confidential
            </div>
            <div className="flex justify-center gap-6 text-on-surface-variant opacity-50">
              <span className="material-symbols-outlined">stars</span>
              <span className="material-symbols-outlined">verified</span>
              <span className="material-symbols-outlined">history_edu</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
