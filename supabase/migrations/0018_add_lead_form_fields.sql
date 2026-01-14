-- =============================================================================
-- Lead Forms - Campos customizáveis (estilo Google Forms)
--
-- Estratégia simples e flexível:
-- - Guardar o schema dos campos em JSONB na própria lead_forms.
-- - Evita join/tabela extra e facilita evoluir o builder.
-- =============================================================================

ALTER TABLE public.lead_forms
ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Índice para buscas/filters eventuais por campo/key (não é obrigatório, mas ajuda).
CREATE INDEX IF NOT EXISTS lead_forms_fields_gin_idx
ON public.lead_forms USING GIN (fields);
