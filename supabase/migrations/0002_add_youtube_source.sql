-- Adds 'youtube' as a first-class source type (previously bucketed as
-- generic 'website'), and moves any already-saved YouTube links over to it.

alter table items drop constraint items_source_type_check;

alter table items add constraint items_source_type_check check (
  source_type in (
    'screenshot', 'screen_recording', 'instagram',
    'reddit', 'x', 'medium', 'youtube', 'website'
  )
);

update items
set source_type = 'youtube'
where source_type = 'website'
  and (domain = 'youtube.com' or domain = 'youtu.be');
