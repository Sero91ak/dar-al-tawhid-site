-- DAR AL TAWḤĪD — Quiz-Statistik (Produktion)
-- Nur Ereignisse mit environment=production und app_variant=visitor fließen in Auswertungen.

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  anonymous_session_id text,
  mode text not null default 'standard',
  environment text not null default 'production' check (environment in ('production', 'staging', 'test')),
  app_variant text not null default 'visitor' check (app_variant in ('visitor', 'admin', 'test')),
  app_version text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  total_questions integer not null default 0,
  answered_questions integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  skipped_answers integer not null default 0,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_sessions_prod_idx on public.quiz_sessions (started_at desc)
  where environment = 'production' and app_variant = 'visitor';
create index if not exists quiz_sessions_user_idx on public.quiz_sessions (user_id, started_at desc)
  where user_id is not null;
create index if not exists quiz_sessions_anon_idx on public.quiz_sessions (anonymous_session_id, started_at desc)
  where anonymous_session_id is not null;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  client_attempt_id text not null,
  session_id uuid references public.quiz_sessions(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  anonymous_session_id text,
  question_id text not null,
  question_number integer,
  question_version text not null default '1',
  question_content_hash text not null default '',
  category text not null default '',
  topic text not null default '',
  level text not null default '',
  selected_answer_index integer,
  correct_answer_index integer not null default 0,
  is_correct boolean not null default false,
  is_skipped boolean not null default false,
  attempt_number integer not null default 1,
  is_first_attempt boolean not null default true,
  response_time_ms integer not null default 0,
  answered_at timestamptz not null default now(),
  created_offline boolean not null default false,
  environment text not null default 'production' check (environment in ('production', 'staging', 'test')),
  app_variant text not null default 'visitor' check (app_variant in ('visitor', 'admin', 'test')),
  app_version text not null default '',
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_attempt_id)
);

create index if not exists quiz_attempts_prod_idx on public.quiz_attempts (answered_at desc)
  where environment = 'production' and app_variant = 'visitor';
create index if not exists quiz_attempts_question_idx on public.quiz_attempts (question_id, answered_at desc)
  where environment = 'production' and app_variant = 'visitor';
create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, answered_at desc)
  where user_id is not null;
create index if not exists quiz_attempts_session_idx on public.quiz_attempts (session_id);

create table if not exists public.user_question_progress (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  question_id text not null,
  first_attempt_correct boolean,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  wrong_attempts integer not null default 0,
  consecutive_correct integer not null default 0,
  last_answer_correct boolean,
  learning_status text not null default 'learning',
  first_answered_at timestamptz,
  last_answered_at timestamptz,
  mastered_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.user_quiz_statistics (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  unique_questions_answered integer not null default 0,
  total_attempts integer not null default 0,
  correct_first_attempts integer not null default 0,
  wrong_first_attempts integer not null default 0,
  first_attempt_accuracy numeric(6, 4) not null default 0,
  current_accuracy numeric(6, 4) not null default 0,
  weighted_knowledge_score numeric(8, 4) not null default 0,
  learning_gain numeric(6, 4) not null default 0,
  completed_sessions integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  average_response_time_ms integer not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_category_statistics (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  category text not null,
  unique_questions_answered integer not null default 0,
  correct_first_attempts integer not null default 0,
  wrong_first_attempts integer not null default 0,
  first_attempt_accuracy numeric(6, 4) not null default 0,
  current_accuracy numeric(6, 4) not null default 0,
  weighted_score numeric(8, 4) not null default 0,
  knowledge_level text not null default '',
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.quiz_sessions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_question_progress enable row level security;
alter table public.user_quiz_statistics enable row level security;
alter table public.user_category_statistics enable row level security;

-- Service role / Worker schreibt und liest; anon darf nur ingest über Worker.
drop policy if exists "quiz_sessions_service_all" on public.quiz_sessions;
create policy "quiz_sessions_service_all" on public.quiz_sessions for all using (true) with check (true);

drop policy if exists "quiz_attempts_service_all" on public.quiz_attempts;
create policy "quiz_attempts_service_all" on public.quiz_attempts for all using (true) with check (true);

drop policy if exists "user_question_progress_service_all" on public.user_question_progress;
create policy "user_question_progress_service_all" on public.user_question_progress for all using (true) with check (true);

drop policy if exists "user_quiz_statistics_service_all" on public.user_quiz_statistics;
create policy "user_quiz_statistics_service_all" on public.user_quiz_statistics for all using (true) with check (true);

drop policy if exists "user_category_statistics_service_all" on public.user_category_statistics;
create policy "user_category_statistics_service_all" on public.user_category_statistics for all using (true) with check (true);

comment on table public.quiz_sessions is 'Quiz-Sitzungen — nur production+visitor in Admin-Auswertungen.';
comment on table public.quiz_attempts is 'Einzelne Quiz-Antworten mit client_attempt_id für Offline-Dedup.';
