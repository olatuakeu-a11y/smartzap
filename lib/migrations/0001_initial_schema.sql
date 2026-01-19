-- =============================================================================
-- SmartZap v2 - Consolidated Schema for Supabase
-- Combined Migration: All migrations consolidated
-- Updated: 2026-01-19
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  total_sent bigint;
  total_delivered bigint;
  total_read bigint;
  total_failed bigint;
  active_campaigns bigint;
  delivery_rate integer;
BEGIN
  SELECT
    coalesce(sum(sent), 0),
    coalesce(sum(delivered), 0),
    coalesce(sum(read), 0),
    coalesce(sum(failed), 0)
  INTO
    total_sent,
    total_delivered,
    total_read,
    total_failed
  FROM campaigns;

  SELECT count(*)
  INTO active_campaigns
  FROM campaigns
  WHERE status in ('Enviando', 'Agendado');

  IF total_sent > 0 THEN
    delivery_rate := round((total_delivered::numeric / total_sent::numeric) * 100);
  ELSE
    delivery_rate := 0;
  END IF;

  RETURN json_build_object(
    'totalSent', total_sent,
    'totalDelivered', total_delivered,
    'totalRead', total_read,
    'totalFailed', total_failed,
    'activeCampaigns', active_campaigns,
    'deliveryRate', delivery_rate
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_campaign_stat(campaign_id_input text, field text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF field = 'sent' THEN
    UPDATE campaigns SET sent = COALESCE(sent, 0) + 1 WHERE id = campaign_id_input;
  ELSIF field = 'delivered' THEN
    UPDATE campaigns SET delivered = COALESCE(delivered, 0) + 1 WHERE id = campaign_id_input;
  ELSIF field = 'read' THEN
    UPDATE campaigns SET read = COALESCE(read, 0) + 1 WHERE id = campaign_id_input;
  ELSIF field = 'failed' THEN
    UPDATE campaigns SET failed = COALESCE(failed, 0) + 1 WHERE id = campaign_id_input;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_campaign_dispatch_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- When a contact is first claimed (sending_at set), set first_dispatch_at once.
  if (new.sending_at is not null) and (old.sending_at is null) then
    update public.campaigns
      set first_dispatch_at = coalesce(first_dispatch_at, new.sending_at)
      where id = new.campaign_id;
  end if;

  -- When a contact gets a sent_at for the first time, push last_sent_at forward.
  if (new.sent_at is not null) and (old.sent_at is null) then
    update public.campaigns
      set last_sent_at = greatest(coalesce(last_sent_at, new.sent_at), new.sent_at)
      where id = new.campaign_id;
  end if;

  return new;
end;
$$;

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
    id text DEFAULT concat('c_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    name text NOT NULL,
    status text DEFAULT 'Rascunho'::text NOT NULL,
    template_name text,
    template_id text,
    template_variables jsonb,
    template_snapshot jsonb,
    template_spec_hash text,
    template_parameter_format text,
    template_fetched_at timestamp with time zone,
    scheduled_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    total_recipients integer DEFAULT 0,
    sent integer DEFAULT 0,
    delivered integer DEFAULT 0,
    read integer DEFAULT 0,
    failed integer DEFAULT 0,
    skipped integer DEFAULT 0,
    last_sent_at timestamp with time zone,
    first_dispatch_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    qstash_schedule_message_id text,
    qstash_schedule_enqueued_at timestamp with time zone,
    flow_id text,
    flow_name text
);

COMMENT ON COLUMN public.campaigns.flow_id IS 'ID do Flow/MiniApp usado na campanha (meta_flow_id)';
COMMENT ON COLUMN public.campaigns.flow_name IS 'Nome do Flow para exibição';

-- =============================================================================
-- CONTACTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
    id text DEFAULT concat('ct_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    name text DEFAULT ''::text NOT NULL,
    phone text NOT NULL UNIQUE,
    email text,
    status text DEFAULT 'Opt-in'::text,
    tags jsonb DEFAULT '[]'::jsonb,
    notes text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

-- =============================================================================
-- CAMPAIGN CONTACTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id text DEFAULT concat('cc_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    campaign_id text NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id text REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone text NOT NULL,
    name text,
    email text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    message_id text,
    sending_at timestamp with time zone,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    failed_at timestamp with time zone,
    skipped_at timestamp with time zone,
    error text,
    skip_code text,
    skip_reason text,
    failure_code integer,
    failure_reason text,
    trace_id text,
    failure_title text,
    failure_details text,
    failure_fbtrace_id text,
    failure_subcode integer,
    failure_href text,
    UNIQUE (campaign_id, contact_id),
    CONSTRAINT campaign_contacts_skipped_reason_check CHECK (((status <> 'skipped'::text) OR (failure_reason IS NOT NULL) OR (error IS NOT NULL)))
);

COMMENT ON COLUMN public.campaign_contacts.email IS 'Snapshot do email do contato no momento da criação da campanha';
COMMENT ON COLUMN public.campaign_contacts.custom_fields IS 'Snapshot dos custom_fields do contato no momento da criação da campanha';
COMMENT ON COLUMN public.campaign_contacts.sending_at IS 'Quando o contato foi "claimado" para envio (idempotência/at-least-once)';
COMMENT ON COLUMN public.campaign_contacts.skipped_at IS 'Quando o envio foi ignorado pelo pré-check/guard-rail';
COMMENT ON COLUMN public.campaign_contacts.skip_code IS 'Código estável do motivo de skip (ex.: MISSING_REQUIRED_PARAM)';
COMMENT ON COLUMN public.campaign_contacts.skip_reason IS 'Motivo legível do skip (para UI e auditoria)';

-- =============================================================================
-- TEMPLATES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.templates (
    id text DEFAULT concat('tpl_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    name text NOT NULL UNIQUE,
    category text,
    language text DEFAULT 'pt_BR'::text,
    status text,
    parameter_format text DEFAULT 'positional'::text,
    components jsonb,
    spec_hash text,
    fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    header_media_preview_url text,
    header_media_preview_expires_at timestamp with time zone,
    header_media_preview_updated_at timestamp with time zone
);

-- =============================================================================
-- SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- ACCOUNT ALERTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.account_alerts (
    id text DEFAULT concat('alert_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    type text NOT NULL,
    code integer,
    message text NOT NULL,
    details jsonb,
    dismissed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =============================================================================
-- TEMPLATE PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.template_projects (
    id text DEFAULT concat('tp_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    user_id text,
    title text NOT NULL,
    prompt text,
    status text DEFAULT 'draft'::text,
    template_count integer DEFAULT 0,
    approved_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.template_project_items (
    id text DEFAULT concat('tpi_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    project_id text NOT NULL REFERENCES public.template_projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    language text DEFAULT 'pt_BR'::text,
    category text DEFAULT 'UTILITY'::text,
    status text DEFAULT 'draft'::text,
    meta_id text,
    meta_status text,
    rejected_reason text,
    submitted_at timestamp with time zone,
    components jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

-- =============================================================================
-- CUSTOM FIELD DEFINITIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id text DEFAULT concat('cfd_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    key text NOT NULL,
    label text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    options jsonb,
    entity_type text DEFAULT 'contact'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (entity_type, key)
);

-- =============================================================================
-- CAMPAIGN METRICS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_batch_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id text NOT NULL,
    trace_id text NOT NULL,
    batch_index integer NOT NULL,
    configured_batch_size integer,
    batch_size integer NOT NULL,
    concurrency integer NOT NULL,
    adaptive_enabled boolean DEFAULT false NOT NULL,
    target_mps integer,
    floor_delay_ms integer,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    skipped_count integer DEFAULT 0 NOT NULL,
    meta_requests integer DEFAULT 0 NOT NULL,
    meta_time_ms integer DEFAULT 0 NOT NULL,
    db_time_ms integer DEFAULT 0 NOT NULL,
    saw_throughput_429 boolean DEFAULT false NOT NULL,
    batch_ok boolean DEFAULT true NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaign_run_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id text NOT NULL,
    trace_id text NOT NULL,
    template_name text,
    recipients integer,
    sent_total integer,
    failed_total integer,
    skipped_total integer,
    first_dispatch_at timestamp with time zone,
    last_sent_at timestamp with time zone,
    dispatch_duration_ms integer,
    throughput_mps numeric,
    meta_avg_ms numeric,
    db_avg_ms numeric,
    saw_throughput_429 boolean DEFAULT false NOT NULL,
    config jsonb,
    config_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (campaign_id, trace_id)
);

CREATE TABLE IF NOT EXISTS public.campaign_trace_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trace_id text NOT NULL,
    ts timestamp with time zone NOT NULL,
    campaign_id text,
    step text,
    phase text NOT NULL,
    ok boolean,
    ms integer,
    batch_index integer,
    contact_id text,
    phone_masked text,
    extra jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =============================================================================
-- PHONE SUPPRESSIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.phone_suppressions (
    id text DEFAULT concat('ps_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    phone text NOT NULL UNIQUE,
    is_active boolean DEFAULT true NOT NULL,
    reason text,
    source text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone,
    expires_at timestamp with time zone
);

COMMENT ON TABLE public.phone_suppressions IS 'Lista global de supressão (não enviar para estes telefones).';
COMMENT ON COLUMN public.phone_suppressions.phone IS 'Telefone normalizado em E.164 (ex.: +5511999999999)';
COMMENT ON COLUMN public.phone_suppressions.source IS 'Origem: inbound_keyword, meta_opt_out_error, manual, etc.';
COMMENT ON COLUMN public.phone_suppressions.expires_at IS 'Quando definido, a supressão expira automaticamente (quarentena).';

-- =============================================================================
-- FLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.flows (
    id text DEFAULT concat('fl_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    name text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    meta_flow_id text,
    spec jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    template_key text,
    flow_json jsonb,
    flow_version text,
    mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    meta_status text,
    meta_preview_url text,
    meta_validation_errors jsonb,
    meta_last_checked_at timestamp with time zone,
    meta_published_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.flow_submissions (
    id text DEFAULT concat('fs_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    message_id text NOT NULL UNIQUE,
    from_phone text NOT NULL,
    contact_id text REFERENCES public.contacts(id) ON DELETE SET NULL,
    flow_id text,
    flow_name text,
    flow_token text,
    response_json_raw text NOT NULL,
    response_json jsonb,
    waba_id text,
    phone_number_id text,
    message_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    flow_local_id text REFERENCES public.flows(id) ON DELETE SET NULL,
    mapped_data jsonb,
    mapped_at timestamp with time zone,
    campaign_id text REFERENCES public.campaigns(id) ON DELETE SET NULL
);

-- =============================================================================
-- LEAD FORMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lead_forms (
    id text DEFAULT concat('lf_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    tag text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    success_message text,
    webhook_token text UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    collect_email boolean DEFAULT true NOT NULL
);

-- =============================================================================
-- WHATSAPP STATUS EVENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_status_events (
    id text DEFAULT concat('wse_', replace((uuid_generate_v4())::text, '-'::text, ''::text)) PRIMARY KEY,
    message_id text NOT NULL,
    status text NOT NULL,
    event_ts timestamp with time zone,
    event_ts_raw text,
    dedupe_key text NOT NULL,
    recipient_id text,
    errors jsonb,
    payload jsonb,
    apply_state text DEFAULT 'pending'::text NOT NULL,
    applied boolean DEFAULT false NOT NULL,
    applied_at timestamp with time zone,
    apply_error text,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    campaign_contact_id text REFERENCES public.campaign_contacts(id) ON DELETE SET NULL,
    campaign_id text REFERENCES public.campaigns(id) ON DELETE SET NULL,
    first_received_at timestamp with time zone DEFAULT now() NOT NULL,
    last_received_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =============================================================================
-- WORKFLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflows (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    owner_company_id text,
    active_version_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id text PRIMARY KEY,
    workflow_id text NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    version integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    nodes jsonb NOT NULL,
    edges jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone
);

-- Add FK for workflows.active_version_id after workflow_versions exists
ALTER TABLE public.workflows
    ADD CONSTRAINT workflows_active_version_fk
    FOREIGN KEY (active_version_id) REFERENCES public.workflow_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id text PRIMARY KEY,
    workflow_id text NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    version_id text REFERENCES public.workflow_versions(id) ON DELETE SET NULL,
    status text DEFAULT 'running'::text NOT NULL,
    trigger_type text,
    input jsonb,
    output jsonb,
    error text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.workflow_run_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    run_id text NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    node_id text NOT NULL,
    node_name text,
    node_type text,
    status text NOT NULL,
    input jsonb,
    output jsonb,
    error text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.workflow_conversations (
    id text PRIMARY KEY,
    workflow_id text NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    phone text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    resume_node_id text,
    variable_key text,
    variables jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflow_builder_executions (
    id text PRIMARY KEY,
    workflow_id text NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    input jsonb,
    output jsonb,
    error text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.workflow_builder_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    execution_id text NOT NULL REFERENCES public.workflow_builder_executions(id) ON DELETE CASCADE,
    node_id text NOT NULL,
    node_name text,
    node_type text,
    status text NOT NULL,
    input jsonb,
    output jsonb,
    error text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.campaign_stats_summary AS
SELECT
    (count(*))::integer AS total_campaigns,
    (COALESCE(sum(sent), (0)::bigint))::integer AS total_sent,
    (COALESCE(sum(delivered), (0)::bigint))::integer AS total_delivered,
    (COALESCE(sum(read), (0)::bigint))::integer AS total_read,
    (COALESCE(sum(failed), (0)::bigint))::integer AS total_failed,
    (count(CASE WHEN (status = ANY (ARRAY['enviando'::text, 'sending'::text, 'SENDING'::text])) THEN 1 ELSE NULL::integer END))::integer AS active_campaigns,
    (count(CASE WHEN (status = ANY (ARRAY['concluida'::text, 'completed'::text, 'COMPLETED'::text])) THEN 1 ELSE NULL::integer END))::integer AS completed_campaigns,
    (count(CASE WHEN (status = ANY (ARRAY['rascunho'::text, 'draft'::text, 'DRAFT'::text])) THEN 1 ELSE NULL::integer END))::integer AS draft_campaigns,
    (count(CASE WHEN (status = ANY (ARRAY['pausado'::text, 'paused'::text, 'PAUSED'::text])) THEN 1 ELSE NULL::integer END))::integer AS paused_campaigns,
    (count(CASE WHEN (status = ANY (ARRAY['agendado'::text, 'scheduled'::text, 'SCHEDULED'::text])) THEN 1 ELSE NULL::integer END))::integer AS scheduled_campaigns,
    (count(CASE WHEN (status = ANY (ARRAY['falhou'::text, 'failed'::text, 'FAILED'::text])) THEN 1 ELSE NULL::integer END))::integer AS failed_campaigns,
    (COALESCE(sum(CASE WHEN (created_at > (now() - '24:00:00'::interval)) THEN sent ELSE 0 END), (0)::bigint))::integer AS sent_24h,
    (COALESCE(sum(CASE WHEN (created_at > (now() - '24:00:00'::interval)) THEN delivered ELSE 0 END), (0)::bigint))::integer AS delivered_24h,
    (COALESCE(sum(CASE WHEN (created_at > (now() - '24:00:00'::interval)) THEN failed ELSE 0 END), (0)::bigint))::integer AS failed_24h
FROM public.campaigns;

COMMENT ON VIEW public.campaign_stats_summary IS 'Pre-aggregated campaign statistics for dashboard. Reduces DB queries from O(n) to O(1).';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_first_dispatch_at_idx ON public.campaigns(first_dispatch_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_last_sent_at_idx ON public.campaigns(last_sent_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_cancelled_at_idx ON public.campaigns(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_qstash_schedule_message_id ON public.campaigns(qstash_schedule_message_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_flow_id ON public.campaigns(flow_id) WHERE (flow_id IS NOT NULL);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON public.contacts USING gin(custom_fields);

-- Campaign Contacts
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON public.campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON public.campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_message_id ON public.campaign_contacts(message_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_phone ON public.campaign_contacts(campaign_id, phone);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_trace_id ON public.campaign_contacts(trace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_sending_at ON public.campaign_contacts(sending_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_skipped_at ON public.campaign_contacts(skipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_failure ON public.campaign_contacts(failure_code);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_failure_title ON public.campaign_contacts(failure_title);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_failure_subcode ON public.campaign_contacts(failure_subcode);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_failure_fbtrace_id ON public.campaign_contacts(failure_fbtrace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_failed_recent ON public.campaign_contacts(campaign_id, failed_at DESC) WHERE (status = 'failed'::text);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_name ON public.templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- Account Alerts
CREATE INDEX IF NOT EXISTS idx_account_alerts_type ON public.account_alerts(type);
CREATE INDEX IF NOT EXISTS idx_account_alerts_dismissed ON public.account_alerts(dismissed);
CREATE INDEX IF NOT EXISTS idx_account_alerts_dismissed_created ON public.account_alerts(dismissed, created_at DESC);

-- Template Projects
CREATE INDEX IF NOT EXISTS idx_template_projects_status ON public.template_projects(status);
CREATE INDEX IF NOT EXISTS idx_template_project_items_project ON public.template_project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_template_project_items_status ON public.template_project_items(status);

-- Custom Field Definitions
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_entity ON public.custom_field_definitions(entity_type);

-- Campaign Metrics
CREATE INDEX IF NOT EXISTS campaign_batch_metrics_campaign_idx ON public.campaign_batch_metrics(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_batch_metrics_trace_idx ON public.campaign_batch_metrics(trace_id, batch_index);
CREATE INDEX IF NOT EXISTS campaign_run_metrics_campaign_idx ON public.campaign_run_metrics(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_run_metrics_created_idx ON public.campaign_run_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_run_metrics_config_hash_idx ON public.campaign_run_metrics(config_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_trace_events_trace_idx ON public.campaign_trace_events(trace_id, ts DESC);
CREATE INDEX IF NOT EXISTS campaign_trace_events_campaign_idx ON public.campaign_trace_events(campaign_id, ts DESC);
CREATE INDEX IF NOT EXISTS campaign_trace_events_trace_phase_idx ON public.campaign_trace_events(trace_id, phase, ts DESC);

-- Phone Suppressions
CREATE INDEX IF NOT EXISTS idx_phone_suppressions_phone ON public.phone_suppressions(phone);
CREATE INDEX IF NOT EXISTS idx_phone_suppressions_active ON public.phone_suppressions(is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_phone_suppressions_expires ON public.phone_suppressions(expires_at) WHERE (expires_at IS NOT NULL);

-- Flows
CREATE INDEX IF NOT EXISTS idx_flows_status ON public.flows(status);
CREATE INDEX IF NOT EXISTS idx_flows_meta_flow_id ON public.flows(meta_flow_id);
CREATE INDEX IF NOT EXISTS idx_flows_template_key ON public.flows(template_key);
CREATE INDEX IF NOT EXISTS idx_flows_meta_status ON public.flows(meta_status);
CREATE INDEX IF NOT EXISTS idx_flows_created_at ON public.flows(created_at DESC);

-- Flow Submissions
CREATE INDEX IF NOT EXISTS idx_flow_submissions_flow_id ON public.flow_submissions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_from_phone ON public.flow_submissions(from_phone);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_contact_id ON public.flow_submissions(contact_id);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_created_at ON public.flow_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_flow_local_id ON public.flow_submissions(flow_local_id);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_campaign_id ON public.flow_submissions(campaign_id);

-- Lead Forms
CREATE INDEX IF NOT EXISTS idx_lead_forms_slug ON public.lead_forms(slug);
CREATE INDEX IF NOT EXISTS idx_lead_forms_is_active ON public.lead_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_forms_collect_email ON public.lead_forms(collect_email);
CREATE INDEX IF NOT EXISTS lead_forms_fields_gin_idx ON public.lead_forms USING gin(fields);

-- WhatsApp Status Events
CREATE INDEX IF NOT EXISTS idx_whatsapp_status_events_message_id ON public.whatsapp_status_events(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status_events_apply_state ON public.whatsapp_status_events(apply_state);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status_events_last_received_at ON public.whatsapp_status_events(last_received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_status_events_dedupe_key ON public.whatsapp_status_events(dedupe_key);

-- Workflows
CREATE INDEX IF NOT EXISTS workflow_versions_workflow_id_idx ON public.workflow_versions(workflow_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_versions_workflow_version_idx ON public.workflow_versions(workflow_id, version);
CREATE INDEX IF NOT EXISTS workflow_runs_workflow_id_idx ON public.workflow_runs(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS workflow_runs_version_id_idx ON public.workflow_runs(version_id, started_at DESC);
CREATE INDEX IF NOT EXISTS workflow_run_logs_run_id_idx ON public.workflow_run_logs(run_id, started_at DESC);
CREATE INDEX IF NOT EXISTS workflow_conversations_workflow_id_idx ON public.workflow_conversations(workflow_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS workflow_conversations_phone_idx ON public.workflow_conversations(phone, updated_at DESC);
CREATE INDEX IF NOT EXISTS workflow_builder_executions_workflow_id_idx ON public.workflow_builder_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS workflow_builder_logs_execution_id_idx ON public.workflow_builder_logs(execution_id, started_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_campaign_contacts_dispatch_metrics ON public.campaign_contacts;
CREATE TRIGGER trg_campaign_contacts_dispatch_metrics
    AFTER UPDATE OF sending_at, sent_at ON public.campaign_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_campaign_dispatch_metrics();

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
