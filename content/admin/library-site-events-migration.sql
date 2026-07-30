-- Bibliothek-Events in site_events erlauben (CHECK-Constraint erweitern)
-- Ohne diese Migration werden library_view/library_read/library_download mit HTTP 400 abgelehnt
-- und stats_totals bleibt bei 0.

ALTER TABLE public.site_events DROP CONSTRAINT IF EXISTS site_events_event_type_check;

ALTER TABLE public.site_events ADD CONSTRAINT site_events_event_type_check CHECK (
  event_type = ANY (ARRAY[
    'page_view'::text,
    'post_view'::text,
    'post_share'::text,
    'post_save'::text,
    'dua_view'::text,
    'dua_share'::text,
    'library_click'::text,
    'library_view'::text,
    'library_read'::text,
    'library_download'::text
  ])
);
