-- campaign_trace_events: timeline estruturada para debug (run/trace model)
--
-- Objetivo:
-- - Persistir eventos de execução (dispatch/workflow/webhook) correlacionados por trace_id.
-- - Permitir uma UI "Trace View" sem depender de logs da Vercel.
-- - Manter baixo volume: o app deve persistir só eventos de alto sinal (erro, start/end, etc.).
--
-- Observação:
-- - A aplicação também escreve logs estruturados (console). Esta tabela é o "source of truth" para investigação.
--
create extension if not exists pgcrypto;

create table if not exists public.campaign_trace_events (
  id uuid primary key default gen_random_uuid(),

  trace_id text not null,
  ts timestamptz not null,

  campaign_id text null,
  step text null,
  phase text not null,

  ok boolean null,
  ms integer null,

  batch_index integer null,
  contact_id text null,
  phone_masked text null,

  extra jsonb null,

  created_at timestamptz not null default now()
);

create index if not exists campaign_trace_events_trace_idx
  on public.campaign_trace_events (trace_id, ts desc);

create index if not exists campaign_trace_events_campaign_idx
  on public.campaign_trace_events (campaign_id, ts desc);

create index if not exists campaign_trace_events_trace_phase_idx
  on public.campaign_trace_events (trace_id, phase, ts desc);

