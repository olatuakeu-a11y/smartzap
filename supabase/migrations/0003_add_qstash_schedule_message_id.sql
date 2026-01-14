-- Store QStash scheduled message id for one-shot scheduled campaigns
-- Enables canceling a scheduled campaign before it starts.

alter table if exists public.campaigns
  add column if not exists qstash_schedule_message_id text;

alter table if exists public.campaigns
  add column if not exists qstash_schedule_enqueued_at timestamptz;

create index if not exists idx_campaigns_qstash_schedule_message_id
  on public.campaigns (qstash_schedule_message_id);
