-- Add first_dispatch_at to campaigns for measuring dispatch duration (sent only)
-- first_dispatch_at: when we start dispatching (first contact claimed/sending)

alter table if exists public.campaigns
  add column if not exists first_dispatch_at timestamptz null;

create index if not exists campaigns_first_dispatch_at_idx
  on public.campaigns (first_dispatch_at desc);
