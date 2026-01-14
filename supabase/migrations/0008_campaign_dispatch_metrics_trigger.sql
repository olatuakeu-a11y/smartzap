-- Keep campaign dispatch metrics in sync based on campaign_contacts updates.
-- This makes the "tempo de envio (sent-only)" reliable even if application code changes.
--
-- Metrics:
-- - campaigns.first_dispatch_at: first time any contact was claimed/sending
-- - campaigns.last_sent_at: last time any contact got sent_at

-- Ensure columns exist (idempotent)
alter table if exists public.campaigns
  add column if not exists first_dispatch_at timestamptz null;

alter table if exists public.campaigns
  add column if not exists last_sent_at timestamptz null;

-- campaign_contacts precisa de sending_at (usado para métricas e claim/sending).
-- Observação: este campo também é reforçado/ indexado em migrations posteriores.
alter table if exists public.campaign_contacts
  add column if not exists sending_at timestamptz null;

-- Function: update metrics on row updates
create or replace function public.update_campaign_dispatch_metrics()
returns trigger
language plpgsql
as $$
begin
  -- When a contact is first claimed (sending_at set), set first_dispatch_at once.
  if (new.sending_at is not null) and (old.sending_at is null) then
    update public.campaigns
      set first_dispatch_at = coalesce(first_dispatch_at, new.sending_at)
      where id = new.campaign_id;
  end if;

  -- When a contact gets a sent_at for the first time, push last_sent_at forward.
  if (new.sent_at is not null) and (old.sent_at is null) then
    update public.campaigns
      set last_sent_at = greatest(coalesce(last_sent_at, new.sent_at), new.sent_at)
      where id = new.campaign_id;
  end if;

  return new;
end;
$$;

-- Trigger: fire after updates that may change sending_at / sent_at
-- Use DROP/CREATE to keep idempotent.
drop trigger if exists trg_campaign_contacts_dispatch_metrics on public.campaign_contacts;

create trigger trg_campaign_contacts_dispatch_metrics
after update of sending_at, sent_at on public.campaign_contacts
for each row
execute function public.update_campaign_dispatch_metrics();

-- Optional backfill (safe): fill missing metrics from existing campaign_contacts
-- Only fills when campaigns columns are null.
with agg as (
  select
    campaign_id,
    min(sending_at) as first_dispatch_at,
    max(sent_at) as last_sent_at
  from public.campaign_contacts
  group by campaign_id
)
update public.campaigns c
set
  first_dispatch_at = coalesce(c.first_dispatch_at, agg.first_dispatch_at),
  last_sent_at = coalesce(c.last_sent_at, agg.last_sent_at)
from agg
where c.id = agg.campaign_id
  and (c.first_dispatch_at is null or c.last_sent_at is null);

create index if not exists campaigns_first_dispatch_at_idx
  on public.campaigns (first_dispatch_at desc);

create index if not exists campaigns_last_sent_at_idx
  on public.campaigns (last_sent_at desc);
