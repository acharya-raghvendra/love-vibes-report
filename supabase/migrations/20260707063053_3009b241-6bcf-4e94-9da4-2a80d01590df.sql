-- 0001_love_match_cache
create table if not exists public.love_match_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.love_match_cache enable row level security;
create index if not exists love_match_cache_created_at_idx
  on public.love_match_cache (created_at);

-- 0002_love_match_orders
create table if not exists public.love_match_orders (
  order_id      text primary key,
  person_a      jsonb not null,
  person_b      jsonb not null,
  language      text not null default 'en',
  ref_year      int  not null,
  status        text not null default 'created',
  pdf_url       text,
  whatsapp_sent boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.love_match_prose_cache (
  prose_key   text primary key,
  sections    jsonb not null,
  created_at  timestamptz not null default now()
);

alter table public.love_match_orders enable row level security;
alter table public.love_match_prose_cache enable row level security;

create index if not exists love_match_orders_status_idx on public.love_match_orders (status);