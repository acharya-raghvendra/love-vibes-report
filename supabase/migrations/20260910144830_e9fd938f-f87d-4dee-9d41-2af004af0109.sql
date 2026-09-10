-- =====================================================================
-- report_languages: single source of truth for report language options
-- love_match_orders.language confirmed TEXT, values en / hi only.
-- =====================================================================

create table if not exists public.report_languages (
  code          text primary key,          -- 'en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml'
  native_label  text not null,             -- shown in the form dropdown
  english_label text not null,             -- shown in admin
  script        text not null,             -- drives font + CSS block in buildReportHtml
  sort_order    int  not null default 100,
  enabled       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.report_languages is
  'Buyer-facing report language options. enabled=false hides the language from the form.';
comment on column public.report_languages.script is
  'latin | devanagari | tamil | telugu | kannada | malayalam. Selects font and line-height block.';

-- ---------------------------------------------------------------------
-- Seed, all seven enabled
-- ---------------------------------------------------------------------
insert into public.report_languages
  (code, native_label, english_label, script, sort_order, enabled)
values
  ('en', 'English',   'English',   'latin',      10, true),
  ('hi', 'हिंदी',       'Hindi',     'devanagari', 20, true),
  ('mr', 'मराठी',       'Marathi',   'devanagari', 30, true),
  ('ta', 'தமிழ்',       'Tamil',     'tamil',      40, true),
  ('te', 'తెలుగు',       'Telugu',    'telugu',     50, true),
  ('kn', 'ಕನ್ನಡ',        'Kannada',   'kannada',    60, true),
  ('ml', 'മലയാളം',     'Malayalam', 'malayalam',  70, true)
on conflict (code) do update
  set native_label  = excluded.native_label,
      english_label = excluded.english_label,
      script        = excluded.script,
      sort_order    = excluded.sort_order,
      updated_at    = now();

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_report_languages_updated_at on public.report_languages;
create trigger trg_report_languages_updated_at
  before update on public.report_languages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: anon reads ENABLED rows only. Writes are service_role only.
-- ---------------------------------------------------------------------
alter table public.report_languages enable row level security;

drop policy if exists report_languages_public_read on public.report_languages;
create policy report_languages_public_read
  on public.report_languages
  for select
  to anon, authenticated
  using (enabled = true);

-- No insert / update / delete policy on purpose.
-- service_role bypasses RLS, so edge functions and admin can still write.

-- ---------------------------------------------------------------------
-- Link orders to the language table
-- ---------------------------------------------------------------------
alter table public.love_match_orders
  drop constraint if exists love_match_orders_language_fkey;

alter table public.love_match_orders
  add constraint love_match_orders_language_fkey
  foreign key (language) references public.report_languages(code);

-- ---------------------------------------------------------------------
-- Index for the admin language filter
-- ---------------------------------------------------------------------
create index if not exists idx_love_match_orders_language
  on public.love_match_orders (language, created_at desc);
