-- DAR AL TAWḤID – Live-Statistik (einmal in Supabase SQL Editor ausführen)

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in (
    'page_view', 'post_view', 'post_share', 'post_save', 'dua_view', 'dua_share'
  )),
  content_type text,
  content_id text,
  content_title text,
  session_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_events_created on public.site_events (created_at desc);
create index if not exists idx_site_events_session on public.site_events (session_id, created_at desc);

create table if not exists public.stats_totals (
  content_type text not null,
  content_id text not null,
  content_title text,
  views bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id)
);

create or replace function public.update_stats_totals()
returns trigger
language plpgsql
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

create or replace function public.analytics_live()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'live_now', (
      select count(distinct session_id)
      from public.site_events
      where created_at > now() - interval '5 minutes'
    ),
    'today_sessions', (
      select count(distinct session_id)
      from public.site_events
      where created_at >= date_trunc('day', now() at time zone 'Europe/Berlin')
    ),
    'today_views', (
      select count(*)
      from public.site_events
      where created_at >= date_trunc('day', now() at time zone 'Europe/Berlin')
        and event_type in ('page_view', 'post_view', 'dua_view')
    ),
    'today_shares', (
      select count(*)
      from public.site_events
      where created_at >= date_trunc('day', now() at time zone 'Europe/Berlin')
        and event_type in ('post_share', 'dua_share')
    ),
    'today_saves', (
      select count(*)
      from public.site_events
      where created_at >= date_trunc('day', now() at time zone 'Europe/Berlin')
        and event_type = 'post_save'
    )
  );
$$;

alter table public.site_events enable row level security;
alter table public.stats_totals enable row level security;

drop policy if exists "anon_insert_events" on public.site_events;
create policy "anon_insert_events" on public.site_events
  for insert to anon, authenticated with check (true);

drop policy if exists "anon_read_totals" on public.stats_totals;
create policy "anon_read_totals" on public.stats_totals
  for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant insert on public.site_events to anon, authenticated;
grant select on public.stats_totals to anon, authenticated;
grant execute on function public.analytics_live() to anon, authenticated;
