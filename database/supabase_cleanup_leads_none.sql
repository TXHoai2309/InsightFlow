-- Cleanup lead workflow rows that are no longer qualified leads.
-- Run in Supabase SQL Editor after deploying the app logic changes.
--
-- Rule: only hot/warm/cold are valid lead intents. Rows whose effective
-- intent is none/empty/unknown are removed from public.leads because audit
-- history lives in label_change_requests and label_change_history.

begin;

with effective_leads as (
  select
    id,
    coalesce(
      nullif(lower(current_labels->>'intent'), ''),
      nullif(lower(labels->>'intent'), ''),
      nullif(lower(intent), ''),
      'none'
    ) as effective_intent
  from public.leads
)
update public.leads l
set
  intent = e.effective_intent,
  updated_at = now()
from effective_leads e
where
  l.id = e.id
  and e.effective_intent in ('hot', 'warm', 'cold')
  and l.intent is distinct from e.effective_intent;

with effective_leads as (
  select
    id,
    coalesce(
      nullif(lower(current_labels->>'intent'), ''),
      nullif(lower(labels->>'intent'), ''),
      nullif(lower(intent), ''),
      'none'
    ) as effective_intent
  from public.leads
)
delete from public.leads l
using effective_leads e
where
  l.id = e.id
  and e.effective_intent not in ('hot', 'warm', 'cold');

commit;

select
  intent,
  count(*) as total
from public.leads
group by intent
order by intent;
