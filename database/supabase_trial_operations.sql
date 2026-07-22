begin;

create table if not exists public.ops_consultations (
  id text primary key,
  status text not null default 'pending',
  email text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ops_consultations_created_at_idx
  on public.ops_consultations (created_at desc);
create index if not exists ops_consultations_status_idx
  on public.ops_consultations (status, created_at desc);
create index if not exists ops_consultations_email_idx
  on public.ops_consultations (lower(email));

create table if not exists public.ops_crawl_runs (
  id text primary key,
  run_type text not null check (run_type in ('production', 'trial')),
  status text not null check (status in (
    'queued', 'waiting_resource', 'running', 'labeling', 'syncing',
    'completed', 'partial', 'failed', 'cancelled'
  )),
  platforms text[] not null default '{}',
  current_platform text,
  current_phase text,
  progress_current integer not null default 0,
  progress_total integer not null default 0,
  posts_found integer not null default 0,
  comments_found integer not null default 0,
  errors_count integer not null default 0,
  workspace_id text,
  consultation_id text references public.ops_consultations(id) on delete set null,
  requested_by text,
  claimed_by text,
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  last_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ops_crawl_runs_created_at_idx
  on public.ops_crawl_runs (created_at desc);
create index if not exists ops_crawl_runs_claim_idx
  on public.ops_crawl_runs (status, created_at)
  where run_type = 'trial' and status in ('queued', 'waiting_resource');
create index if not exists ops_crawl_runs_consultation_idx
  on public.ops_crawl_runs (consultation_id, created_at desc);

create table if not exists public.ops_crawl_run_events (
  id bigint generated always as identity primary key,
  run_id text not null references public.ops_crawl_runs(id) on delete cascade,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  platform text,
  phase text,
  event_type text not null check (event_type in (
    'started', 'progress', 'heartbeat', 'completed', 'failed', 'cancelled'
  )),
  message text not null,
  progress_current integer,
  progress_total integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ops_crawl_run_events
  add column if not exists source_event_id text;

create index if not exists ops_crawl_run_events_run_created_idx
  on public.ops_crawl_run_events (run_id, created_at desc);
create unique index if not exists ops_crawl_run_events_source_idx
  on public.ops_crawl_run_events (run_id, source_event_id);

alter table public.ops_consultations enable row level security;
alter table public.ops_crawl_runs enable row level security;
alter table public.ops_crawl_run_events enable row level security;

revoke all on public.ops_consultations from anon, authenticated;
revoke all on public.ops_crawl_runs from anon, authenticated;
revoke all on public.ops_crawl_run_events from anon, authenticated;
grant all on public.ops_consultations to service_role;
grant all on public.ops_crawl_runs to service_role;
grant all on public.ops_crawl_run_events to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.claim_trial_ops_crawl_run(
  p_worker_id text,
  p_capabilities text[] default '{}',
  p_lease_seconds integer default 900
)
returns setof public.ops_crawl_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_id text;
begin
  select run.id
    into selected_id
    from public.ops_crawl_runs as run
   where run.run_type = 'trial'
     and (
       run.status = 'queued'
       or (
         run.status = 'waiting_resource'
         and coalesce(run.lease_expires_at, '-infinity'::timestamptz) <= now()
       )
     )
     and (
       coalesce(cardinality(p_capabilities), 0) = 0
       or run.platforms <@ p_capabilities
     )
   order by run.created_at asc
   for update skip locked
   limit 1;

  if selected_id is null then
    return;
  end if;

  return query
  update public.ops_crawl_runs
     set status = 'waiting_resource',
         current_phase = 'claimed',
         claimed_by = p_worker_id,
         claimed_at = now(),
         lease_expires_at = now() + make_interval(secs => greatest(60, least(p_lease_seconds, 3600))),
         heartbeat_at = now(),
         updated_at = now()
   where id = selected_id
  returning *;
end;
$$;

revoke all on function public.claim_trial_ops_crawl_run(text, text[], integer) from public, anon, authenticated;
grant execute on function public.claim_trial_ops_crawl_run(text, text[], integer) to service_role;

commit;
