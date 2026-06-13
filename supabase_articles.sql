-- Articles feature — run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Untitled',
  subtitle      text,
  cover_url     text,
  blocks        jsonb not null default '[]'::jsonb,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists articles_user_idx on public.articles (user_id);
create index if not exists articles_published_idx on public.articles (published, published_at desc);

alter table public.articles enable row level security;

-- Owner can read/write all of their own articles (drafts included).
drop policy if exists "owner full access" on public.articles;
create policy "owner full access" on public.articles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone (even signed-out visitors) can read PUBLISHED articles.
drop policy if exists "public can read published" on public.articles;
create policy "public can read published" on public.articles
  for select
  using (published = true);
