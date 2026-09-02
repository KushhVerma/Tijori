-- Adds manual drag-and-drop ordering. Uses a float "position" column
-- (fractional indexing) so reordering one item only ever needs to update
-- that single row — no renumbering the whole list on every drag.

alter table items add column if not exists position double precision;

-- Backfill existing rows so "Custom order" starts out matching what users
-- already see today (newest first), spaced widely apart so future manual
-- reorders always have room to insert between two neighbours.
with ordered as (
  select id, row_number() over (partition by user_id order by created_at desc) as rn
  from items
)
update items
set position = ordered.rn * 1000
from ordered
where items.id = ordered.id
  and items.position is null;

create index if not exists items_user_position_idx on items (user_id, position);
