-- Operational routing is intentionally separate from API classification labels.
-- Run this migration before enabling business transfer in production.

alter table public.leads
  add column if not exists operational_queue text,
  add column if not exists previous_operational_queue text,
  add column if not exists transfer_reason text,
  add column if not exists transfer_note text,
  add column if not exists transferred_by text,
  add column if not exists transferred_by_name text,
  add column if not exists transferred_at timestamptz,
  add column if not exists transfer_count integer default 0,
  add column if not exists transfer_history jsonb default '[]'::jsonb;

update public.leads
set transfer_count = 0
where transfer_count is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_operational_queue_check'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_operational_queue_check
      check (operational_queue is null or operational_queue in ('lead', 'crisis'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_previous_operational_queue_check'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_previous_operational_queue_check
      check (
        previous_operational_queue is null
        or previous_operational_queue in ('lead', 'crisis')
      );
  end if;
end
$$;

create index if not exists leads_operational_queue_idx
  on public.leads (operational_queue, transferred_at desc);

notify pgrst, 'reload schema';
