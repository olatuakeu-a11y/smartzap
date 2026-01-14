-- Workflow conversations (chatbot state)
CREATE TABLE IF NOT EXISTS workflow_conversations (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  resume_node_id TEXT,
  variable_key TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_conversations_workflow_id_idx
  ON workflow_conversations (workflow_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS workflow_conversations_phone_idx
  ON workflow_conversations (phone, updated_at DESC);
