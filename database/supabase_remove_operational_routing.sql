-- Retire manual business transfer without deleting historical audit data.
-- Run once after deploying the application version that no longer reads or
-- writes operational_queue and transfer metadata.

begin;

drop function if exists public.transfer_business_queue(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

do $$
begin
  if to_regclass('public.leads') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'operational_queue'
  ) then
    -- Returning this field to NULL makes API classification the only routing
    -- source. Previous queue and transfer_history remain available for audit.
    update public.leads
    set operational_queue = null
    where operational_queue is not null;

    drop index if exists public.leads_operational_queue_idx;
  end if;

  if to_regclass('public.business_transfer_events') is not null then
    revoke all on public.business_transfer_events from public, anon, authenticated;
  end if;
end
$$;

commit;

notify pgrst, 'reload schema';
