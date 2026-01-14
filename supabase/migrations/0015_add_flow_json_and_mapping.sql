-- =============================================================================
-- Flows: armazenar Flow JSON (Meta) + mapping de campos (SmartZap)
-- =============================================================================

-- flows: adiciona colunas para authoring/publicação
ALTER TABLE IF EXISTS public.flows
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS flow_json JSONB,
  ADD COLUMN IF NOT EXISTS flow_version TEXT,
  ADD COLUMN IF NOT EXISTS mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS meta_status TEXT,
  ADD COLUMN IF NOT EXISTS meta_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_validation_errors JSONB,
  ADD COLUMN IF NOT EXISTS meta_last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_flows_template_key ON public.flows (template_key);
CREATE INDEX IF NOT EXISTS idx_flows_meta_status ON public.flows (meta_status);

-- flow_submissions: link local flow + persistir mapping aplicado
ALTER TABLE IF EXISTS public.flow_submissions
  ADD COLUMN IF NOT EXISTS flow_local_id TEXT REFERENCES public.flows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mapped_data JSONB,
  ADD COLUMN IF NOT EXISTS mapped_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_flow_submissions_flow_local_id ON public.flow_submissions (flow_local_id);

-- Reload PostgREST schema (safe)
NOTIFY pgrst, 'reload schema';
