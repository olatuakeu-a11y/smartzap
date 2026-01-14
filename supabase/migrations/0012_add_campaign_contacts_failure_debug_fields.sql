-- campaign_contacts: informações extras quando um envio falha
--
-- Por que isso existe:
-- Quando o WhatsApp/Meta recusa um envio, ele devolve dados técnicos do erro.
-- Guardar isso ajuda a:
-- - entender o que aconteceu
-- - investigar mais rápido
-- - abrir ticket com a Meta com evidência
--
-- O que guardamos (só quando falhar):
-- - failure_fbtrace_id: “protocolo”/id da Meta para rastrear o erro
-- - failure_subcode: um detalhe numérico extra (nem sempre vem)
-- - failure_href: link de referência do erro (quando existir)
--
-- Importante:
-- - Isso só é preenchido quando status = 'failed'
-- - O app limita textos para não salvar coisa gigante

alter table if exists public.campaign_contacts
  add column if not exists failure_fbtrace_id text;

alter table if exists public.campaign_contacts
  add column if not exists failure_subcode integer;

alter table if exists public.campaign_contacts
  add column if not exists failure_href text;

-- Índices opcionais (úteis em debugging; custo baixo)
create index if not exists idx_campaign_contacts_failure_fbtrace_id
  on public.campaign_contacts (failure_fbtrace_id);

create index if not exists idx_campaign_contacts_failure_subcode
  on public.campaign_contacts (failure_subcode);

-- Índice pragmático para triagem de falhas recentes por campanha
create index if not exists idx_campaign_contacts_failed_recent
  on public.campaign_contacts (campaign_id, failed_at desc)
  where status = 'failed';
