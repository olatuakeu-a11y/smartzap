-- campaign_contacts: persistir detalhes do erro em colunas próprias
--
-- Objetivo:
-- - Guardar `title` e `error_data.details` (Meta) separadamente de `failure_reason`.
-- - Facilita UI/relatórios/analytics sem parsing de strings.
--
-- Idempotente: usa IF NOT EXISTS.

alter table if exists public.campaign_contacts
  add column if not exists failure_title text;

alter table if exists public.campaign_contacts
  add column if not exists failure_details text;

-- Índice opcional para investigações por título (pouco custo, útil em debugging)
create index if not exists idx_campaign_contacts_failure_title
  on public.campaign_contacts (failure_title);
