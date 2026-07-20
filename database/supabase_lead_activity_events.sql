-- Operational audit trail for Lead handling.
-- Run after database/supabase_leads_workflow.sql.

alter table public.leads
  add column if not exists updated_by_name text;

create table if not exists public.lead_activity_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  source_mention_id text,
  workspace_id text,
  event_type text not null,
  actor_type text not null default 'system',
  actor_uid text,
  actor_name text,
  actor_role text,
  from_status text,
  to_status text,
  channel text,
  result_type text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  event_source text not null default 'live',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  idempotency_key text
);

create unique index if not exists lead_activity_events_idempotency_idx
  on public.lead_activity_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists lead_activity_events_lead_time_idx
  on public.lead_activity_events (lead_id, occurred_at desc, id desc);

create index if not exists lead_activity_events_scope_time_idx
  on public.lead_activity_events (workspace_id, occurred_at desc);

grant select on public.lead_activity_events to anon, authenticated;
revoke insert, update, delete on public.lead_activity_events from anon, authenticated;

alter table public.lead_activity_events enable row level security;

drop policy if exists lead_activity_events_select_policy on public.lead_activity_events;

-- Application APIs enforce Firebase role and brand scope. These policies keep
-- compatibility with the current Supabase authentication model until Firebase
-- claims are mirrored into Supabase JWTs.
create policy lead_activity_events_select_policy
  on public.lead_activity_events
  for select
  to anon, authenticated
  using (true);

create or replace function public.insightflow_log_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_actor_type text;
  event_actor_name text;
  event_actor_uid text;
  event_actor_role text;
  event_workspace text;
  event_mention text;
  event_updated_at timestamptz;
  previous_status text;
  previous_last_action_at timestamptz;
  previous_result_recorded_at timestamptz;
  previous_follow_up_at timestamptz;
  previous_notes text;
  previous_sales_transferred_at timestamptz;
begin
  event_actor_uid := nullif(new.updated_by, '');
  event_actor_role := nullif(new.updated_by_role, '');
  event_actor_name := coalesce(
    nullif(new.updated_by_name, ''),
    nullif(new.owner_name, ''),
    nullif(new.owner_email, ''),
    case when event_actor_uid is null then 'Hệ thống' else 'Nhân viên xử lý' end
  );
  event_actor_type := case when event_actor_uid is null then 'system' else 'employee' end;
  event_workspace := coalesce(nullif(new.workspace_id, ''), nullif(new.brand, ''));
  event_mention := coalesce(nullif(new.source_mention_id, ''), nullif(new.mention_id, ''));
  event_updated_at := coalesce(new.updated_at, now());

  if tg_op = 'UPDATE' then
    previous_status := old.status;
    previous_last_action_at := old.last_action_at;
    previous_result_recorded_at := old.result_recorded_at;
    previous_follow_up_at := old.follow_up_at;
    previous_notes := old.notes;
    previous_sales_transferred_at := old.sales_transferred_at;
  end if;

  if tg_op = 'INSERT' then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_name, description, event_source, occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace, 'lead_created', 'system',
      'Hệ thống', 'Lead được ghi nhận vào hàng đợi xử lý.', 'live',
      coalesce(new.created_at, event_updated_at),
      'lead:' || new.id || ':created'
    ) on conflict do nothing;

    if nullif(new.owner_id, '') is not null then
      insert into public.lead_activity_events (
        lead_id, source_mention_id, workspace_id, event_type, actor_type,
        actor_uid, actor_name, actor_role, description, metadata, occurred_at, idempotency_key
      ) values (
        new.id, event_mention, event_workspace, 'assigned', event_actor_type,
        event_actor_uid, event_actor_name, event_actor_role, 'Phân công người phụ trách Lead.',
        jsonb_build_object('owner_id', new.owner_id, 'owner_name', new.owner_name, 'owner_email', new.owner_email),
        coalesce(new.claimed_at, new.assigned_at, event_updated_at),
        'lead:' || new.id || ':assigned:' || extract(epoch from coalesce(new.claimed_at, new.assigned_at, event_updated_at))::text
      ) on conflict do nothing;
    end if;
  else
    if old.owner_id is distinct from new.owner_id then
      insert into public.lead_activity_events (
        lead_id, source_mention_id, workspace_id, event_type, actor_type,
        actor_uid, actor_name, actor_role, description, metadata, occurred_at, idempotency_key
      ) values (
        new.id, event_mention, event_workspace,
        case when nullif(new.owner_id, '') is null then 'unassigned' else 'assigned' end,
        event_actor_type, event_actor_uid, event_actor_name, event_actor_role,
        case when nullif(new.owner_id, '') is null then 'Hủy phân công người phụ trách.' else 'Thay đổi người phụ trách Lead.' end,
        jsonb_build_object(
          'from_owner_id', old.owner_id, 'from_owner_name', old.owner_name,
          'to_owner_id', new.owner_id, 'to_owner_name', new.owner_name, 'to_owner_email', new.owner_email
        ),
        event_updated_at,
        'lead:' || new.id || ':owner:' || extract(epoch from event_updated_at)::text
      ) on conflict do nothing;
    end if;
  end if;

  if (tg_op = 'INSERT' and coalesce(new.status, 'new') <> 'new')
     or (tg_op = 'UPDATE' and previous_status is distinct from new.status) then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, from_status, to_status,
      description, occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace, 'status_changed', event_actor_type,
      event_actor_uid, event_actor_name, event_actor_role,
      case when tg_op = 'UPDATE' then previous_status else null end, new.status,
      'Cập nhật trạng thái xử lý Lead.', event_updated_at,
      'lead:' || new.id || ':status:' || extract(epoch from event_updated_at)::text
    ) on conflict do nothing;
  end if;

  if new.last_action_at is not null
     and (tg_op = 'INSERT' or previous_last_action_at is distinct from new.last_action_at) then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, channel, description, metadata,
      occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace,
      case
        when new.last_action_type = 'note' then 'note_updated'
        when new.last_action_type = 'skip' then 'closed'
        else 'contact_action'
      end,
      event_actor_type, event_actor_uid, event_actor_name, event_actor_role,
      new.last_contact_channel,
      case
        when new.last_action_type = 'open_source' then 'Mở nguồn để liên hệ khách hàng.'
        when new.last_action_type = 'open_profile' then 'Mở hồ sơ khách hàng.'
        when new.last_action_type = 'message' then 'Gửi tin nhắn cho khách hàng.'
        when new.last_action_type = 'call' then 'Thực hiện cuộc gọi cho khách hàng.'
        when new.last_action_type = 'email' then 'Gửi email cho khách hàng.'
        when new.last_action_type = 'note' then 'Cập nhật ghi chú xử lý.'
        when new.last_action_type = 'skip' then 'Bỏ qua và đóng Lead.'
        when new.last_action_type = 'restore' then 'Khôi phục Lead để tiếp tục xử lý.'
        else 'Thực hiện thao tác xử lý Lead.'
      end,
      jsonb_build_object('action_type', new.last_action_type),
      new.last_action_at,
      'lead:' || new.id || ':action:' || extract(epoch from new.last_action_at)::text
    ) on conflict do nothing;
  end if;

  if new.result_recorded_at is not null
     and (tg_op = 'INSERT' or previous_result_recorded_at is distinct from new.result_recorded_at) then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, result_type, description,
      occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace, 'result_recorded', event_actor_type,
      event_actor_uid, event_actor_name, event_actor_role, new.result_type,
      'Ghi nhận kết quả xử lý Lead.', new.result_recorded_at,
      'lead:' || new.id || ':result:' || extract(epoch from new.result_recorded_at)::text
    ) on conflict do nothing;
  end if;

  if tg_op = 'UPDATE' and previous_follow_up_at is distinct from new.follow_up_at then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, description, metadata,
      occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace,
      case when new.follow_up_at is null then 'follow_up_cancelled' else 'follow_up_scheduled' end,
      event_actor_type, event_actor_uid, event_actor_name, event_actor_role,
      case when new.follow_up_at is null then 'Hủy lịch follow-up.' else 'Đặt lịch follow-up.' end,
      jsonb_build_object('from', previous_follow_up_at, 'to', new.follow_up_at),
      event_updated_at,
      'lead:' || new.id || ':follow-up:' || extract(epoch from event_updated_at)::text
    ) on conflict do nothing;
  end if;

  if tg_op = 'UPDATE' and previous_notes is distinct from new.notes
     and new.last_action_type is distinct from 'note' then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, description, occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace, 'note_updated', event_actor_type,
      event_actor_uid, event_actor_name, event_actor_role, 'Cập nhật ghi chú xử lý.',
      event_updated_at,
      'lead:' || new.id || ':note:' || extract(epoch from event_updated_at)::text
    ) on conflict do nothing;
  end if;

  if new.sales_transferred_at is not null
     and (tg_op = 'INSERT' or previous_sales_transferred_at is distinct from new.sales_transferred_at) then
    insert into public.lead_activity_events (
      lead_id, source_mention_id, workspace_id, event_type, actor_type,
      actor_uid, actor_name, actor_role, description, metadata,
      occurred_at, idempotency_key
    ) values (
      new.id, event_mention, event_workspace, 'sales_transferred', event_actor_type,
      event_actor_uid, event_actor_name, event_actor_role, 'Chuyển Lead cho bộ phận Sales.',
      jsonb_build_object('sales_owner_id', new.sales_owner_id, 'sales_owner_name', new.sales_owner_name, 'crm_deal_id', new.crm_deal_id),
      new.sales_transferred_at,
      'lead:' || new.id || ':sales:' || extract(epoch from new.sales_transferred_at)::text
    ) on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists insightflow_log_lead_activity_trigger on public.leads;
create trigger insightflow_log_lead_activity_trigger
after insert or update on public.leads
for each row execute function public.insightflow_log_lead_activity();

-- Best-effort historical milestones. They are intentionally marked as
-- backfill because the current Lead snapshot cannot reconstruct every action.
insert into public.lead_activity_events (
  lead_id, source_mention_id, workspace_id, event_type, actor_type,
  actor_name, description, event_source, occurred_at, idempotency_key
)
select
  id,
  coalesce(source_mention_id, mention_id),
  coalesce(workspace_id, brand),
  'lead_created',
  'system',
  'Hệ thống',
  'Lead được ghi nhận vào hàng đợi xử lý.',
  'backfill',
  coalesce(created_at, posted_at, updated_at, now()),
  'backfill:' || id || ':created'
from public.leads
on conflict do nothing;

insert into public.lead_activity_events (
  lead_id, source_mention_id, workspace_id, event_type, actor_type,
  actor_uid, actor_name, actor_role, description, metadata,
  event_source, occurred_at, idempotency_key
)
select
  id,
  coalesce(source_mention_id, mention_id),
  coalesce(workspace_id, brand),
  'assigned',
  'employee',
  owner_id,
  coalesce(owner_name, owner_email, 'Nhân viên xử lý'),
  updated_by_role,
  'Mốc phân công được khôi phục từ trạng thái Lead hiện tại.',
  jsonb_build_object('owner_id', owner_id, 'owner_name', owner_name),
  'backfill',
  coalesce(claimed_at, assigned_at),
  'backfill:' || id || ':assigned'
from public.leads
where coalesce(claimed_at, assigned_at) is not null
on conflict do nothing;

insert into public.lead_activity_events (
  lead_id, source_mention_id, workspace_id, event_type, actor_type,
  actor_uid, actor_name, actor_role, channel, description, metadata,
  event_source, occurred_at, idempotency_key
)
select
  id,
  coalesce(source_mention_id, mention_id),
  coalesce(workspace_id, brand),
  case when last_action_type = 'skip' then 'closed' else 'contact_action' end,
  'employee',
  updated_by,
  coalesce(updated_by_name, owner_name, owner_email, 'Nhân viên xử lý'),
  updated_by_role,
  last_contact_channel,
  'Mốc thao tác gần nhất được khôi phục từ trạng thái Lead hiện tại.',
  jsonb_build_object('action_type', last_action_type),
  'backfill',
  last_action_at,
  'backfill:' || id || ':last-action'
from public.leads
where last_action_at is not null
on conflict do nothing;

insert into public.lead_activity_events (
  lead_id, source_mention_id, workspace_id, event_type, actor_type,
  actor_uid, actor_name, actor_role, result_type, description,
  event_source, occurred_at, idempotency_key
)
select
  id,
  coalesce(source_mention_id, mention_id),
  coalesce(workspace_id, brand),
  'result_recorded',
  'employee',
  updated_by,
  coalesce(updated_by_name, owner_name, owner_email, 'Nhân viên xử lý'),
  updated_by_role,
  result_type,
  'Mốc kết quả được khôi phục từ trạng thái Lead hiện tại.',
  'backfill',
  result_recorded_at,
  'backfill:' || id || ':result'
from public.leads
where result_recorded_at is not null
on conflict do nothing;
