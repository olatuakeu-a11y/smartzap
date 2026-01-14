-- Add last_sent_at to campaigns for measuring dispatch duration (sent only)
-- This timestamp is updated by the campaign workflow when at least one contact is marked as sent.

alter table if exists public.campaigns
  add column if not exists last_sent_at timestamptz null;

create index if not exists campaigns_last_sent_at_idx
  on public.campaigns (last_sent_at desc);
