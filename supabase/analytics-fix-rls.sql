-- DAR AL TAWḤID – Fix: Statistik blieb bei 0 (RLS blockierte Inserts)
-- Einmal im Supabase SQL Editor ausführen (Run)

-- Trigger darf stats_totals als Owner schreiben (nicht als anon)
create or replace function public.update_stats_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.event_type in ('post_view', 'dua_view', 'page_view') then
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
  elsif NEW.event_type in ('post_share', 'dua_share') then
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
  elsif NEW.event_type = 'post_save' then
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
$$;

drop trigger if exists trg_update_stats_totals on public.site_events;
create trigger trg_update_stats_totals
after insert on public.site_events
for each row execute function public.update_stats_totals();

-- RLS neu setzen
alter table public.site_events enable row level security;
alter table public.stats_totals enable row level security;

drop policy if exists "anon_insert_events" on public.site_events;
drop policy if exists "anon_read_totals" on public.stats_totals;
drop policy if exists "site_events_insert_anon" on public.site_events;
drop policy if exists "stats_totals_select_anon" on public.stats_totals;

create policy "site_events_insert_anon"
on public.site_events
for insert
to anon, authenticated
with check (true);

create policy "stats_totals_select_anon"
on public.stats_totals
for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant insert on public.site_events to anon, authenticated;
grant select on public.stats_totals to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.analytics_live() to anon, authenticated;
