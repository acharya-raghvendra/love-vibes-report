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
  nameError,
  onValidateName,
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
  nameError: string | null;
  onValidateName: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
}) {
  const errorId = `p${index}-name-error`;
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
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? errorId : undefined}
            onChange={(e) => {
              setName(e.target.value);
              onValidateName(e.target.value);
            }}
            onBlur={(e) => onValidateName(e.target.value)}
            placeholder="Enter full name in English"
            className={`w-full border-0 border-b bg-transparent px-0 py-2 font-headline-sm text-headline-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 ${
              nameError ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
            }`}
          />
          {nameError && (
            <p id={errorId} role="alert" className="mt-2 font-label-md text-label-sm text-error">
              {nameError}
            </p>
          )}
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Latin letters (incl. accents) plus space, hyphen, apostrophe.
// Must start and end with a letter; at least 2 chars.
const LATIN_NAME_RE = /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F'\u2019 -]*[A-Za-z\u00C0-\u024F]$/;
const NAME_ERROR = "Please enter the name in English.";

function isLatinName(v: string): boolean {
  return LATIN_NAME_RE.test(v.trim());
}

function normaliseEmail(v: string): string {
  return v.trim().toLowerCase().slice(0, 254);
}

function InputPage() {
  const navigate = useNavigate();
  const [p1Name, setP1Name] = useState("");
  const [p1NameError, setP1NameError] = useState<string | null>(null);
  const [p1Dob, setP1Dob] = useState("");
  const [p1DobError, setP1DobError] = useState<string | null>(null);
  const [p1Gender, setP1Gender] = useState<Gender>("MALE");
  const [p2Name, setP2Name] = useState("");
  const [p2NameError, setP2NameError] = useState<string | null>(null);
  const [p2Dob, setP2Dob] = useState("");
  const [p2DobError, setP2DobError] = useState<string | null>(null);
  const [p2Gender, setP2Gender] = useState<Gender>("FEMALE");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const p1NameRef = useRef<HTMLInputElement>(null);
  const p1DobRef = useRef<HTMLInputElement>(null);
  const p2NameRef = useRef<HTMLInputElement>(null);
  const p2DobRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function validateName(value: string, setError: (v: string | null) => void): boolean {
    const valid = isLatinName(value);
    setError(valid ? null : NAME_ERROR);
    return valid;
  }

  function validateDob(value: string, setError: (v: string | null) => void): boolean {
    const valid = Boolean(value);
    setError(valid ? null : DOB_ERROR);
    return valid;
  }

  function validatePhone(value: string): boolean {
    const valid = value.replace(/\D/g, "").length >= 10;
    setPhoneError(valid ? null : PHONE_ERROR);
    return valid;
  }

  function validateEmail(value: string): boolean {
    const clean = normaliseEmail(value);
    if (!clean) {
      setEmailError("Email address is required — we send your report here.");
      return false;
    }
    if (!EMAIL_RE.test(clean)) {
      setEmailError("Enter a valid email address, e.g. name@example.com");
      return false;
    }
    setEmailError(null);
    return true;
  }

  function focusField(ref: React.RefObject<HTMLInputElement | null>) {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    const checks: Array<{ ok: boolean; ref: React.RefObject<HTMLInputElement | null> }> = [
      { ok: validateName(p1Name, setP1NameError), ref: p1NameRef },
      { ok: validateDob(p1Dob, setP1DobError), ref: p1DobRef },
      { ok: validateName(p2Name, setP2NameError), ref: p2NameRef },
      { ok: validateDob(p2Dob, setP2DobError), ref: p2DobRef },
      { ok: validatePhone(phone), ref: phoneRef },
      { ok: validateEmail(email), ref: emailRef },
    ];

    const firstInvalid = checks.find((c) => !c.ok);
    if (firstInvalid) {
      focusField(firstInvalid.ref);
      return;
    }

    const cleanEmail = normaliseEmail(email);

    const splitName = (n: string) => {
      const parts = n.trim().split(/\s+/);
      return { first: parts[0], last: parts.slice(1).join(" ") };
    };
    const a = splitName(p1Name);
    const b = splitName(p2Name);
    const payload = {
      person_a: {
        ...a,
        dob: p1Dob,
        gender: p1Gender,
        phone: phone.replace(/\D/g, ""),
        email: cleanEmail,
      },
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
              nameError={p1NameError}
              onValidateName={(v) => validateName(v, setP1NameError)}
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
              nameError={p2NameError}
              onValidateName={(v) => validateName(v, setP2NameError)}
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
              WhatsApp Number <span className="text-primary">*</span>
              <span className="ml-1 normal-case tracking-normal text-on-surface-variant/70">(required to deliver your report)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-3 font-label-md text-on-surface-variant">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                ref={phoneRef}
                value={phone}
                aria-invalid={phoneError ? true : undefined}
                aria-describedby={phoneError ? "phone-error" : undefined}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                onBlur={(e) => validatePhone(e.target.value)}
                placeholder="WhatsApp Number"
                className={`font-body-lg flex-1 rounded-lg border bg-surface-container px-4 py-3 text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:ring-1 ${
                  phoneError
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/30 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            <FieldError id="phone-error" message={phoneError} />

          </div>

          {/* Email */}
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 p-6">
            <label
              htmlFor="email"
              className="mb-2 flex items-center gap-2 font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              Email Address <span className="text-primary">*</span>
              <span className="ml-1 normal-case tracking-normal text-on-surface-variant/70">(your report is emailed here)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              ref={emailRef}
              maxLength={254}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              placeholder="name@example.com"
              className={`font-body-lg w-full rounded-lg border bg-surface-container px-4 py-3 text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:ring-1 ${
                emailError
                  ? "border-error focus:border-error focus:ring-error"
                  : "border-outline-variant/30 focus:border-primary focus:ring-primary"
              }`}
            />
            <FieldError id="email-error" message={emailError} />

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
