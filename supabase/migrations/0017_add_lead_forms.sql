-- =============================================================================
-- Lead Forms (Formulários públicos de captação de contatos)
--
-- Objetivo:
-- - Permitir criar um formulário estilo Google Forms dentro do SmartZap.
-- - Cada formulário aponta para uma TAG predefinida.
-- - Quando alguém preenche, vira automaticamente um contato com aquela tag.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lead_forms (
  id TEXT PRIMARY KEY DEFAULT concat('lf_', replace(uuid_generate_v4()::text, '-', '')::text),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  success_message TEXT,
  webhook_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_forms_slug ON public.lead_forms(slug);
CREATE INDEX IF NOT EXISTS idx_lead_forms_is_active ON public.lead_forms(is_active);
