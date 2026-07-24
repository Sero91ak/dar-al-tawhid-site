-- Bibliothek-Besucherstatistik: Klicks, Gelesen, Downloads
-- Mapping in stats_totals für content_type = 'library':
--   views  -> Klicks (library_click, library_view)
--   shares -> Gelesen (library_read)
--   saves  -> Downloads (library_download)

CREATE OR REPLACE FUNCTION public.update_stats_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.event_type in ('post_view', 'dua_view', 'page_view', 'library_click', 'library_view') then
    insert into public.stats_totals (content_type, content_id, content_title, views)
    values (
      coalesce(NEW.content_type, 'page'),
      coalesce(NEW.content_id, 'unknown'),
      NEW.content_title,
      1
    )
    on conflict (content_type, content_id) do update set
      views = public.stats_totals.views + 1,
      content_title = coalesce(excluded.content_title, public.stats_totals.content_title),
      updated_at = now();
  elsif NEW.event_type in ('post_share', 'dua_share', 'library_read') then
    insert into public.stats_totals (content_type, content_id, content_title, shares)
    values (
      coalesce(NEW.content_type, 'post'),
      coalesce(NEW.content_id, 'unknown'),
      NEW.content_title,
      1
    )
    on conflict (content_type, content_id) do update set
      shares = public.stats_totals.shares + 1,
      content_title = coalesce(excluded.content_title, public.stats_totals.content_title),
      updated_at = now();
  elsif NEW.event_type in ('post_save', 'library_download') then
    insert into public.stats_totals (content_type, content_id, content_title, saves)
    values (
      coalesce(NEW.content_type, 'post'),
      coalesce(NEW.content_id, 'unknown'),
      NEW.content_title,
      1
    )
    on conflict (content_type, content_id) do update set
      saves = public.stats_totals.saves + 1,
      content_title = coalesce(excluded.content_title, public.stats_totals.content_title),
      updated_at = now();
  end if;
  return NEW;
end;
$function$;
