-- DĀR AL TAWḤĪD KIDS · Recovery Foundation V1 (INACTIVE)
-- Additive only. Does NOT touch kids_accounts credentials or progress.
-- Sensitive records are service-role-only, NOT accessible via the public anon key.
-- No automatic password reset is implemented or enabled by this migration.
begin;

create table if not exists public.kids_parent_contacts (
  id uuid primary key default gen_random_uuid(),
  account_name_key text not null check (char_length(account_name_key) between 2 and 100 and account_name_key = lower(btrim(account_name_key))),
  parent_email text not null check (char_length(parent_email) between 5 and 254 and parent_email = lower(btrim(parent_email))),
  verified_at timestamptz,
  proof_method text check (proof_method is null or proof_method in ('authenticated_account','preissued_recovery_code','verified_existing_contact')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kids_parent_contacts_unique unique(account_name_key,parent_email),
  constraint kids_parent_contacts_verified_proof check (verified_at is null or proof_method is not null)
);
create unique index if not exists kids_parent_one_verified_contact
  on public.kids_parent_contacts(account_name_key) where verified_at is not null;

create table if not exists public.kids_account_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  account_name_key text check (account_name_key is null or (char_length(account_name_key) between 2 and 100 and account_name_key=lower(btrim(account_name_key)))),
  reply_email text check (reply_email is null or (char_length(reply_email) between 5 and 254 and reply_email=lower(btrim(reply_email)))),
  origin text not null check (origin in ('kids_app','support_gmail','admin_verified')),
  status text not null default 'received' check(status in
    ('received','ack_pending','awaiting_verification','manual_review',
     'verified','approved','rejected','reset_completed','expired')),
  ownership_proven boolean not null default false,
  proof_method text check (proof_method is null or proof_method in
    ('verified_existing_contact','authenticated_account','preissued_recovery_code')),
  -- Never store raw message contents, passwords, security answers or reset codes.
  external_message_digest text unique check (external_message_digest is null or external_message_digest ~ '^[a-f0-9]{64}$'),
  reply_sent_at timestamptz,
  verified_at timestamptz,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint kids_recovery_verified_requires_evidence
    check (not ownership_proven or (proof_method is not null and verified_at is not null)),
  constraint kids_recovery_no_unverified_approval
    check (status not in ('verified','approved','reset_completed') or ownership_proven),
  constraint kids_recovery_approval_not_just_email
    check (status not in ('approved','reset_completed') or proof_method in
       ('verified_existing_contact','authenticated_account','preissued_recovery_code'))
);
create index if not exists kids_recovery_queue_index
  on public.kids_account_recovery_requests(status,created_at);
create index if not exists kids_recovery_expiry_index
  on public.kids_account_recovery_requests(expires_at);

create table if not exists public.kids_recovery_challenges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.kids_account_recovery_requests(id) on delete cascade,
  purpose text not null check (purpose in ('verify_parent_contact','reset_password')),
  -- Server-secret HMAC/cryptographic digest ONLY, never a raw code/URL token.
  challenge_digest text not null check (challenge_digest ~ '^[a-f0-9]{64}$'),
  attempt_count int not null default 0 check(attempt_count between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint kids_recovery_challenge_lifetime check(expires_at <= created_at + interval '30 minutes')
);
create index if not exists kids_recovery_challenges_by_request
  on public.kids_recovery_challenges(request_id,created_at desc);

create table if not exists public.kids_recovery_audit_events (
  id bigserial primary key,
  request_id uuid not null references public.kids_account_recovery_requests(id) on delete cascade,
  actor_type text not null check(actor_type in ('system','parent_verified','admin_verified')),
  event_type text not null check(event_type in
    ('request_received','ack_queued','ack_sent','verification_queued','verification_sent',
    'verification_failed','verified','manual_review','approved','rejected',
    'reset_completed','expired','cleanup')),
  created_at timestamptz not null default now()
);

-- Enforce no public reads, writes or subscriptions via PostgREST.
alter table public.kids_parent_contacts enable row level security;
alter table public.kids_account_recovery_requests enable row level security;
alter table public.kids_recovery_challenges enable row level security;
alter table public.kids_recovery_audit_events enable row level security;
revoke all on public.kids_parent_contacts, public.kids_account_recovery_requests,
  public.kids_recovery_challenges, public.kids_recovery_audit_events from public, anon, authenticated;
revoke all on sequence public.kids_recovery_audit_events_id_seq from public, anon, authenticated;
grant select,insert,update,delete on public.kids_parent_contacts,
  public.kids_account_recovery_requests, public.kids_recovery_challenges,
  public.kids_recovery_audit_events to service_role;
grant usage,select on sequence public.kids_recovery_audit_events_id_seq to service_role;
-- No policy for anon/authenticated; even a known account name yields no access.
-- Only server-side, verified endpoints may perform future recovery operations.
commit;
