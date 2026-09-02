-- Splits X saves into "Posts" vs "Articles" for the sub-tabs inside the X
-- category. Nullable and only meaningful for source_type = 'x' — every
-- other source type just leaves this null.

alter table items add column x_kind text;

alter table items add constraint items_x_kind_check check (
  x_kind is null or x_kind in ('post', 'article')
);
