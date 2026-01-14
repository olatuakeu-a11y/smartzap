-- =============================================================================
-- Phone suppressions + campaign_contacts skip/sending columns
--
-- Objetivo:
-- - Bloquear re-envios para números que pediram opt-out (via inbound) ou foram suprimidos.
-- - Persistir "skipped" de forma consistente (dispatch/workflow já gravam skip_code/skip_reason/skipped_at).
-- - Garantir que campaign_contacts tenha sending_at (já usado pelo workflow + trigger 0007).
--
-- Idempotente: pode ser aplicado com segurança em ambientes já atualizados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) campaign_contacts: compatibilidade com código atual
-- -----------------------------------------------------------------------------
alter table if exists public.campaign_contacts
  add column if not exists sending_at timestamptz null;

alter table if exists public.campaign_contacts
  add column if not exists skipped_at timestamptz null;

alter table if exists public.campaign_contacts
  add column if not exists skip_code text null;

alter table if exists public.campaign_contacts
  add column if not exists skip_reason text null;

create index if not exists idx_campaign_contacts_skipped_at
  on public.campaign_contacts (skipped_at desc);

create index if not exists idx_campaign_contacts_sending_at
  on public.campaign_contacts (sending_at desc);

-- -----------------------------------------------------------------------------
-- 2) phone_suppressions: supressão global por telefone (E.164)
-- -----------------------------------------------------------------------------
create table if not exists public.phone_suppressions (
  id text primary key default concat('ps_', replace(uuid_generate_v4()::text, '-', '')::text),
  phone text not null,
  is_active boolean not null default true,
  reason text null,
  source text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  expires_at timestamptz null,
  unique(phone)
);

comment on table public.phone_suppressions is 'Lista global de supressão (não enviar para estes telefones).';
comment on column public.phone_suppressions.phone is 'Telefone normalizado em E.164 (ex.: +5511999999999)';
comment on column public.phone_suppressions.source is 'Origem: inbound_keyword, meta_opt_out_error, manual, etc.';
comment on column public.phone_suppressions.expires_at is 'Quando definido, a supressão expira automaticamente (quarentena).';

create index if not exists idx_phone_suppressions_phone
  on public.phone_suppressions (phone);

create index if not exists idx_phone_suppressions_active
  on public.phone_suppressions (is_active) where is_active = true;

create index if not exists idx_phone_suppressions_expires
  on public.phone_suppressions (expires_at) where expires_at is not null;
