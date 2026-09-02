-- Tijori: initial schema
-- Personal inspiration library. Every table is scoped to auth.uid() via RLS,
-- so the data model already supports multi-user even though V1 is single-user.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- items: one row per saved inspiration, regardless of source or client.
-- ---------------------------------------------------------------------------
create table if not exists items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,

  source_type       text not null check (
                       source_type in (
                         'screenshot', 'screen_recording', 'instagram',
                         'reddit', 'x', 'medium', 'website'
                       )
                     ),

  title             text,
  url               text,
  domain            text,
  notes             text,

  favorite          boolean not null default false,
  -- false = shows up in Inbox / New Additions until reviewed.
  organized         boolean not null default false,

  -- Primary media asset, stored in R2. Nullable: a bare saved link has none.
  media_key         text,
  media_kind        text check (media_kind in ('image', 'video')),
  thumbnail_key     text,
  width             integer,
  height            integer,
  duration_seconds  integer,

  -- Which client created this. Only 'web' is used today; the values for
  -- 'extension' / 'ios' / 'api' exist so future clients need no schema change.
  ingest_source     text not null default 'web'
                       check (ingest_source in ('web', 'extension', 'ios', 'api')),
  -- 'pending' lets a low-friction capture (URL + timestamp only) get enriched
  -- (title/thumbnail fetch) after the fact without blocking the client.
  ingest_status     text not null default 'ready'
                       check (ingest_status in ('pending', 'ready', 'failed')),

  -- Free-form bag for future metadata (OG data, AI-derived tags, etc.)
  -- without needing another migration.
  raw_meta          jsonb not null default '{}'::jsonb,

  search_vector     tsvector generated always as (
                       to_tsvector(
                         'english',
                         coalesce(title, '') || ' ' || coalesce(notes, '') || ' ' || coalesce(domain, '')
                       )
                     ) stored,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists items_user_created_idx on items (user_id, created_at desc);
create index if not exists items_user_source_idx on items (user_id, source_type);
create index if not exists items_user_organized_idx on items (user_id, organized);
create index if not exists items_search_idx on items using gin (search_vector);

-- ---------------------------------------------------------------------------
-- tags + item_tags: many-to-many, user-scoped, no rigid folder structure.
-- ---------------------------------------------------------------------------
create table if not exists tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists item_tags (
  item_id  uuid not null references items (id) on delete cascade,
  tag_id   uuid not null references tags (id) on delete cascade,
  primary key (item_id, tag_id)
);

create index if not exists item_tags_tag_idx on item_tags (tag_id);

-- ---------------------------------------------------------------------------
-- api_tokens: the seam future clients (browser extension, iOS share sheet)
-- will authenticate with. Unused by any client in this phase, but the table
-- exists now so the ingestion API doesn't need a breaking change later.
-- ---------------------------------------------------------------------------
create table if not exists api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  token_hash    text not null unique,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: every row is owned, every policy checks auth.uid().
-- ---------------------------------------------------------------------------
alter table items enable row level security;
alter table tags enable row level security;
alter table item_tags enable row level security;
alter table api_tokens enable row level security;

create policy "items_owner_all" on items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags_owner_all" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "item_tags_owner_all" on item_tags
  for all using (
    exists (select 1 from items where items.id = item_tags.item_id and items.user_id = auth.uid())
  )
  with check (
    exists (select 1 from items where items.id = item_tags.item_id and items.user_id = auth.uid())
  );

create policy "api_tokens_owner_all" on api_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
