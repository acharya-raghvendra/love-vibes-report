import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Icon } from "@/components/icon";
import { couponSearch, resolveCoupon, validateCouponSearch } from "@/lib/coupon-link";
import { initAdvancedMatching, trackOnce } from "@/lib/meta-pixel";
import { PriceLine } from "@/components/price-line";
import { INPUT_COPY, META } from "@/lib/site-copy";
import { setSiteLanguage, useLocalizedMeta, useSiteLanguage } from "@/lib/site-language";


export const Route = createFileRoute("/input")({
  validateSearch: validateCouponSearch,
  head: () => ({
    meta: [
      { title: META.input.hi.title },
      { name: "description", content: META.input.hi.description },
      { property: "og:title", content: META.input.hi.title },
      { property: "og:description", content: META.input.hi.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: META.input.hi.title },
      { name: "twitter:description", content: META.input.hi.description },
    ],
    links: [{ rel: "canonical", href: "https://love.talktoguruji.com/input" }],
  }),
  component: InputPage,
});

type Gender = "MALE" | "FEMALE";
type ReportLanguage = "en" | "hi";

function GenderToggle({
  value,
  onChange,
  labels,
  labelledBy,
}: {
  value: Gender;
  onChange: (v: Gender) => void;
  labels: { MALE: string; FEMALE: string };
  labelledBy: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex rounded-full border border-outline-variant/30 bg-surface-container/60 p-1"
    >
      {(["MALE", "FEMALE"] as const).map((g) => {
        const active = value === g;
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(g)}
            className={`flex-1 rounded-full py-2 font-label-md text-label-md transition-all ${
              active
                ? "bg-primary text-on-primary-fixed shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {labels[g]}
          </button>
        );
      })}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-center gap-1.5 font-label-md text-label-md font-medium text-error"
    >
      <Icon name="error" size={16} className="leading-none" />
      {message}
    </p>
  );
}

function PartnerCard({
  index,
  label,
  icon,
  copy,
  name,
  setName,
  nameError,
  onValidateName,
  nameRef,
  dob,
  setDob,
  dobError,
  onValidateDob,
  dobRef,
  gender,
  setGender,
}: {
  index: 1 | 2;
  label: string;
  icon: string;
  copy: (typeof INPUT_COPY)[keyof typeof INPUT_COPY];
  name: string;
  setName: (v: string) => void;
  nameError: string | null;
  onValidateName: (v: string) => void;
  nameRef: RefObject<HTMLInputElement | null>;
  dob: string;
  setDob: (v: string) => void;
  dobError: string | null;
  onValidateDob: (v: string) => void;
  dobRef: RefObject<HTMLInputElement | null>;
  gender: Gender;
  setGender: (v: Gender) => void;
}) {
  const errorId = `p${index}-name-error`;
  const dobErrorId = `p${index}-dob-error`;
  const nameId = `p${index}-name`;
  const dobId = `p${index}-dob`;
  const genderId = `p${index}-gender-label`;

  return (
    <div className="glass-card relative rounded-2xl border border-outline-variant/25 p-6 shadow-2xl lg:p-8">
      <span className="ornate-corner top-left" aria-hidden="true" />
      <span className="ornate-corner bottom-right" aria-hidden="true" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-2 text-primary">
          <Icon name={icon} size={24} />
          {copy.partner(index)}
        </h2>
        <span className="font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>

      <div className="space-y-6">
        <div className="group relative">
          <label
            htmlFor={nameId}
            className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant transition-colors group-focus-within:text-primary"
          >
            {copy.name}
          </label>
          <input
            id={nameId}
            name={nameId}
            autoComplete="name"
            type="text"
            value={name}
            ref={nameRef}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? errorId : undefined}
            onChange={(e) => {
              setName(e.target.value);
              onValidateName(e.target.value);
            }}
            onBlur={(e) => onValidateName(e.target.value)}
            placeholder={copy.namePlaceholder}
            className={`w-full border-0 border-b bg-transparent px-0 py-2 font-headline-sm text-headline-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/40 ${
              nameError
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary"
            }`}
          />
          <FieldError id={errorId} message={nameError} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="group relative">
            <label
              htmlFor={dobId}
              className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              {copy.dob}
            </label>
            <input
              id={dobId}
              name={dobId}
              autoComplete="bday"
              type="date"
              value={dob}
              ref={dobRef}
              aria-invalid={dobError ? true : undefined}
              aria-describedby={dobError ? dobErrorId : undefined}
              onChange={(e) => {
                setDob(e.target.value);
                onValidateDob(e.target.value);
              }}
              onBlur={(e) => onValidateDob(e.target.value)}
              style={{ colorScheme: "dark" }}
              className={`w-full border-0 border-b bg-transparent px-0 py-2 font-body-lg text-body-lg text-on-surface outline-none transition-colors ${
                dobError
                  ? "border-error focus:border-error"
                  : "border-outline-variant focus:border-primary"
              }`}
            />
            <FieldError id={dobErrorId} message={dobError} />
          </div>

          <div>
            <span
              id={genderId}
              className="mb-1 block font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              {copy.gender}
            </span>
            <GenderToggle
              value={gender}
              onChange={setGender}
              labelledBy={genderId}
              labels={{ MALE: copy.male, FEMALE: copy.female }}
            />
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
function isLatinName(v: string): boolean {
  return LATIN_NAME_RE.test(v.trim());
}

function normaliseEmail(v: string): string {
  return v.trim().toLowerCase().slice(0, 254);
}

function InputPage() {
  const navigate = useNavigate();
  const [siteLang, setSiteLang] = useSiteLanguage();
  const copy = INPUT_COPY[siteLang];
  useLocalizedMeta(META.input[siteLang]);
  const { coupon: urlCoupon } = Route.useSearch();
  const [coupon, setCoupon] = useState<string | null>(null);
  // URL coupon wins; the stored mirror covers a lost query param / refresh.
  useEffect(() => {
    setCoupon(resolveCoupon(urlCoupon));
  }, [urlCoupon]);
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
  // Report language mirrors the site language; changing either keeps both in sync.
  const [language, setLanguage] = useState<ReportLanguage>("hi");
  useEffect(() => {
    setLanguage(siteLang);
  }, [siteLang]);

  function chooseLanguage(next: ReportLanguage) {
    setLanguage(next);
    setSiteLang(next);
    setSiteLanguage(next);
  }

  const p1NameRef = useRef<HTMLInputElement>(null);
  const p1DobRef = useRef<HTMLInputElement>(null);
  const p2NameRef = useRef<HTMLInputElement>(null);
  const p2DobRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function validateName(value: string, setError: (v: string | null) => void): boolean {
    const valid = isLatinName(value);
    setError(valid ? null : copy.errors.name);
    return valid;
  }

  function validateDob(value: string, setError: (v: string | null) => void): boolean {
    const valid = Boolean(value);
    setError(valid ? null : copy.errors.dob);
    return valid;
  }

  function validatePhone(value: string): boolean {
    const valid = value.replace(/\D/g, "").length >= 10;
    setPhoneError(valid ? null : copy.errors.phone);
    return valid;
  }

  function validateEmail(value: string): boolean {
    const clean = normaliseEmail(value);
    if (!clean) {
      setEmailError(copy.errors.emailRequired);
      return false;
    }
    if (!EMAIL_RE.test(clean)) {
      setEmailError(copy.errors.emailInvalid);
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
      language,
    };
    try {
      sessionStorage.setItem("loveMatch:input", JSON.stringify(payload));
    } catch {
      /* ignore */
    }

    // Meta Pixel: hashed advanced matching, then one Lead per submitted couple.
    // No raw email/phone or names are ever sent as event params.
    const leadKey = `${a.first}|${p1Dob}|${b.first}|${p2Dob}`;
    void initAdvancedMatching({ email: cleanEmail, phone: phone });
    trackOnce("Lead", leadKey);

    navigate({ to: "/preview", search: couponSearch(coupon) });
  }


  return (
    <div lang={siteLang} className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
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
            {copy.headingLead}
            <span className="text-gold-gradient">{copy.headingAccent}</span>
          </h1>
          <p className="font-body-lg text-body-lg mx-auto max-w-md text-on-surface-variant">
            {copy.sub}
          </p>
        </section>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <PartnerCard
              index={1}
              label={copy.roleA}
              icon="person"
              copy={copy}
              name={p1Name}
              setName={setP1Name}
              nameError={p1NameError}
              onValidateName={(v) => validateName(v, setP1NameError)}
              nameRef={p1NameRef}
              dob={p1Dob}
              setDob={setP1Dob}
              dobError={p1DobError}
              onValidateDob={(v) => validateDob(v, setP1DobError)}
              dobRef={p1DobRef}
              gender={p1Gender}
              setGender={setP1Gender}
            />

            {/* Heart divider — mobile only (between stacked cards) */}
            <div className="flex items-center justify-center py-1 lg:hidden">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative px-6">
              <Icon name="favorite" size={32} filled className="animate-pulse text-primary" />
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
            </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
            </div>

            <PartnerCard
              index={2}
              label={copy.roleB}
              icon="person_2"
              copy={copy}
              name={p2Name}
              setName={setP2Name}
              nameError={p2NameError}
              onValidateName={(v) => validateName(v, setP2NameError)}
              nameRef={p2NameRef}
              dob={p2Dob}
              setDob={setP2Dob}
              dobError={p2DobError}
              onValidateDob={(v) => validateDob(v, setP2DobError)}
              dobRef={p2DobRef}
              gender={p2Gender}
              setGender={setP2Gender}
            />
          </div>

          {/* WhatsApp */}
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 p-6">
            <label
              htmlFor="phone"
              className="mb-2 flex items-center gap-2 font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              <Icon name="chat" size={16} />
              {copy.whatsapp} <span className="text-primary">*</span>
              <span className="ml-1 normal-case tracking-normal text-on-surface-variant/70">
                {copy.whatsappHelp}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-3 font-label-md text-on-surface-variant">
                +91
              </div>
              <input
                id="phone"
                name="phone"
                autoComplete="tel-national"
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
                placeholder={copy.whatsappPlaceholder}
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
              <Icon name="mail" size={16} />
              {copy.email} <span className="text-primary">*</span>
              <span className="ml-1 normal-case tracking-normal text-on-surface-variant/70">
                {copy.emailHelp}
              </span>
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

          {/* Report language */}
          <div className="glass-card rounded-2xl border border-dashed border-outline-variant/40 p-6">
            <span
            id="language-label"
            className="mb-2 flex items-center gap-2 font-label-md text-label-sm uppercase tracking-widest text-on-surface-variant"
          >
            <Icon name="translate" size={16} />
            {copy.language} <span className="text-primary">*</span>
              <span className="ml-1 normal-case tracking-normal text-on-surface-variant/70">
                {copy.languageHelp}
              </span>
            </span>
            <div
              role="radiogroup"
              aria-labelledby="language-label"
              className="flex rounded-full border border-outline-variant/30 bg-surface-container/60 p-1"
            >
              {(
                [
                  { value: "hi", label: "हिंदी (Hindi)" },
                  { value: "en", label: "English" },
                ] as const
              ).map((opt) => {
                const active = language === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => chooseLanguage(opt.value)}
                    className={`flex-1 rounded-full py-3 font-label-md text-label-md transition-all ${
                      active
                        ? "bg-primary text-on-primary-fixed shadow-lg"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <PriceLine lang={siteLang} format={copy.priceLine} className="mb-3 text-center" />
            <button
              type="submit"
              className="shimmer flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary-container to-primary py-5 text-lg font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              <Icon name="auto_awesome" size={24} filled />
              {copy.submit}
            </button>
          </div>

          {/* Trust */}
          <div className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              <Icon name="lock" size={14} />
              {copy.secure}
            </div>
            <div className="flex justify-center gap-6 text-on-surface-variant opacity-50">
              <Icon name="stars" size={24} />
              <Icon name="verified" size={24} />
              <Icon name="history_edu" size={24} />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
