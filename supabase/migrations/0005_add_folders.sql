-- Folders: a second, independent way to group items alongside their source
-- category. Adding an item to a folder never removes it from anywhere else
-- (its source page, tags, etc.) — same many-to-many shape as tags.

create table if not exists folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists item_folders (
  item_id    uuid not null references items (id) on delete cascade,
  folder_id  uuid not null references folders (id) on delete cascade,
  primary key (item_id, folder_id)
);

create index if not exists item_folders_folder_idx on item_folders (folder_id);

alter table folders enable row level security;
alter table item_folders enable row level security;

create policy "folders_owner_all" on folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "item_folders_owner_all" on item_folders
  for all using (
    exists (select 1 from items where items.id = item_folders.item_id and items.user_id = auth.uid())
  )
  with check (
    exists (select 1 from items where items.id = item_folders.item_id and items.user_id = auth.uid())
  );
