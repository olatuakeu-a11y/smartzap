-- =============================================================================
-- Lead Forms - opção de coletar/mostrar email
--
-- Quando collect_email = false:
-- - o formulário público não mostra o campo de email
-- - (opcional) o backend pode ignorar o email enviado
-- =============================================================================

ALTER TABLE public.lead_forms
ADD COLUMN IF NOT EXISTS collect_email BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_lead_forms_collect_email ON public.lead_forms(collect_email);
