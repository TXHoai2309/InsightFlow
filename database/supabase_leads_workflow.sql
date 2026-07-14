-- Supabase lead workflow storage.
-- Firebase remains the auth/account source; this table stores lead handling state.

create table if not exists public.leads (
  id text primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists leads_id_unique_idx on public.leads (id);

alter table public.leads
  add column if not exists mention_id text,
  add column if not exists source_mention_id text,
  add column if not exists parent_id text,
  add column if not exists content_type text,
  add column if not exists post_id text,
  add column if not exists workspace_id text,
  add column if not exists brand text,
  add column if not exists platform text,
  add column if not exists source text,
  add column if not exists author text,
  add column if not exists content text,
  add column if not exists text text,
  add column if not exists intent text,
  add column if not exists current_label text,
  add column if not exists labels jsonb,
  add column if not exists current_labels jsonb,
  add column if not exists intent_signals text[],
  add column if not exists status text default 'new',
  add column if not exists expiry_at timestamptz,
  add column if not exists posted_at timestamptz,
  add column if not exists url text,
  add column if not exists post_url text,
  add column if not exists source_url text,
  add column if not exists label_correction_status text,
  add column if not exists pending_label_request_id text,
  add column if not exists last_label_corrected_at timestamptz,
  add column if not exists operational_queue text,
  add column if not exists previous_operational_queue text,
  add column if not exists transfer_reason text,
  add column if not exists transfer_note text,
  add column if not exists transferred_by text,
  add column if not exists transferred_by_name text,
  add column if not exists transferred_at timestamptz,
  add column if not exists transfer_count integer default 0,
  add column if not exists transfer_history jsonb default '[]'::jsonb,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists zalo_id text,
  add column if not exists messenger_id text,
  add column if not exists social_profile_url text,
  add column if not exists contact text,
  add column if not exists profile_url text,
  add column if not exists firebase_uid text,
  add column if not exists owner_id text,
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by text,
  add column if not exists claimed_at timestamptz,
  add column if not exists first_contacted_at timestamptz,
  add column if not exists contact_attempts integer default 0,
  add column if not exists last_contact_at timestamptz,
  add column if not exists pending_result boolean default false,
  add column if not exists last_action_at timestamptz,
  add column if not exists last_action_type text,
  add column if not exists last_contact_channel text,
  add column if not exists result_type text,
  add column if not exists result_recorded_at timestamptz,
  add column if not exists follow_up_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists sales_status text,
  add column if not exists sales_owner_id text,
  add column if not exists sales_owner_name text,
  add column if not exists sales_transferred_at timestamptz,
  add column if not exists crm_deal_id text,
  add column if not exists notes text,
  add column if not exists updated_by text,
  add column if not exists updated_by_role text;

grant select, insert, update, delete on public.leads to anon, authenticated;

alter table public.leads enable row level security;

drop policy if exists leads_select_policy on public.leads;
drop policy if exists leads_insert_policy on public.leads;
drop policy if exists leads_update_policy on public.leads;
drop policy if exists leads_delete_policy on public.leads;

create policy leads_select_policy
  on public.leads
  for select
  to anon, authenticated
  using (true);

create policy leads_insert_policy
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

create policy leads_update_policy
  on public.leads
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy leads_delete_policy
  on public.leads
  for delete
  to anon, authenticated
  using (true);

-- ── Label Change Requests ────────────────────────────────────────────────────

create table if not exists public.label_change_requests (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  source_id text,
  lead_id text,
  mention_id text,
  workspace_id text,
  platform text,
  author text,
  content_preview text,
  source_url text,
  current_labels jsonb,
  requested_labels jsonb,
  changed_fields text[],
  current_queue text,
  requested_queue text,
  current_label text,
  requested_label text,
  reason_code text,
  reason_note text,
  evidence_checked boolean default false,
  status text default 'pending',
  brand_id text,
  brand_name text,
  requested_by text,
  requested_by_name text,
  requested_by_email text,
  requested_by_role text,
  requested_at timestamptz,
  reviewed_by text,
  reviewed_by_uid text,
  reviewed_by_name text,
  reviewed_by_email text,
  reviewed_at timestamptz,
  review_note text,
  final_label jsonb,
  history jsonb,
  applied_at timestamptz,
  audit_log_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by text,
  updated_by_role text
);

grant select, insert, update, delete on public.label_change_requests to anon, authenticated;

alter table public.label_change_requests
  add column if not exists requested_by_email text,
  add column if not exists reviewed_by_uid text,
  add column if not exists reviewed_by_email text,
  add column if not exists final_label jsonb,
  add column if not exists history jsonb;

create table if not exists public.label_change_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  brand_id text,
  brand_name text,
  workspace_id text,
  mention_id text,
  mention_content text,
  action text,
  status text,
  old_label jsonb,
  new_label jsonb,
  requested_by_name text,
  requested_by_email text,
  requested_by_role text,
  reviewed_by_uid text,
  reviewed_by_name text,
  reviewed_by_email text,
  note text,
  source text,
  changed_at timestamptz default now(),
  created_at timestamptz default now()
);

grant select, insert, update, delete on public.label_change_history to anon, authenticated;

alter table public.label_change_requests enable row level security;

drop policy if exists label_change_requests_select_policy on public.label_change_requests;
drop policy if exists label_change_requests_insert_policy on public.label_change_requests;
drop policy if exists label_change_requests_update_policy on public.label_change_requests;
drop policy if exists label_change_requests_delete_policy on public.label_change_requests;

create policy label_change_requests_select_policy
  on public.label_change_requests
  for select
  to anon, authenticated
  using (true);

create policy label_change_requests_insert_policy
  on public.label_change_requests
  for insert
  to anon, authenticated
  with check (true);

create policy label_change_requests_update_policy
  on public.label_change_requests
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy label_change_requests_delete_policy
  on public.label_change_requests
  for delete
  to anon, authenticated
  using (true);

alter table public.label_change_history enable row level security;

drop policy if exists label_change_history_select_policy on public.label_change_history;
drop policy if exists label_change_history_insert_policy on public.label_change_history;
drop policy if exists label_change_history_update_policy on public.label_change_history;
drop policy if exists label_change_history_delete_policy on public.label_change_history;

create policy label_change_history_select_policy
  on public.label_change_history
  for select
  to anon, authenticated
  using (true);

create policy label_change_history_insert_policy
  on public.label_change_history
  for insert
  to anon, authenticated
  with check (true);

create policy label_change_history_update_policy
  on public.label_change_history
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy label_change_history_delete_policy
  on public.label_change_history
  for delete
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
