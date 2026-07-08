alter table public.love_match_orders
  add column if not exists failure_reason text;

create table if not exists public.love_match_pricing (
  id            int primary key default 1,
  list_price    int not null default 999,
  offer_price   int not null default 599,
  offer_ends_at timestamptz,
  updated_at    timestamptz not null default now(),
  constraint single_row check (id = 1)
);

grant all on public.love_match_pricing to service_role;

insert into public.love_match_pricing (id, list_price, offer_price, offer_ends_at)
values (1, 999, 599, null)
on conflict (id) do nothing;

alter table public.love_match_pricing enable row level security;