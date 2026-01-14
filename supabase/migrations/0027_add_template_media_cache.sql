ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS header_media_id text,
ADD COLUMN IF NOT EXISTS header_media_hash text,
ADD COLUMN IF NOT EXISTS header_media_updated_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_templates_header_media_id ON public.templates(header_media_id);
