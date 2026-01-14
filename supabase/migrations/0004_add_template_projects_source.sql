-- Adds a source discriminator to template_projects so we can separate Manual vs AI in the UI
-- without creating a second "drafts" table.

ALTER TABLE template_projects
ADD COLUMN IF NOT EXISTS source TEXT;

-- Backfill existing projects as AI (default)
UPDATE template_projects
SET source = COALESCE(source, 'ai');

-- Optional: enforce allowed values (kept lax for compatibility)
-- You can tighten later with a CHECK constraint when all environments are migrated.
-- ALTER TABLE template_projects ADD CONSTRAINT template_projects_source_check CHECK (source IN ('ai', 'manual'));

CREATE INDEX IF NOT EXISTS idx_template_projects_source ON template_projects(source);
