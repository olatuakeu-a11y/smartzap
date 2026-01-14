-- Enable local manual template drafts alongside Meta-synced templates
-- We keep everything in the `templates` table to avoid schema drift.

ALTER TABLE templates
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'meta',
ADD COLUMN IF NOT EXISTS parameter_format TEXT,
ADD COLUMN IF NOT EXISTS meta_id TEXT,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
ADD COLUMN IF NOT EXISTS quality_score TEXT,
ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spec_hash TEXT;

-- Backfill existing rows as meta
UPDATE templates
SET source = COALESCE(source, 'meta');

CREATE INDEX IF NOT EXISTS idx_templates_source ON templates(source);
CREATE INDEX IF NOT EXISTS idx_templates_status_source ON templates(status, source);
