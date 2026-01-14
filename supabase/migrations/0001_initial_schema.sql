-- =============================================================================
-- SmartZap v2 - Baseline consolidado (gerado automaticamente)
--
-- Gerado a partir da full chain (21 migrations) via pg_dump --schema-only.
--
-- Segurança:
-- - Este baseline deve rodar APENAS em banco vazio.
-- - Se já existir qualquer tabela em public, falha cedo.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Baseline deve ser aplicado apenas em um banco vazio (schema public já contém tabelas).';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE FUNCTION public.get_dashboard_stats() RETURNS json
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
CREATE FUNCTION public.increment_campaign_stat(campaign_id_input text, field text) RETURNS void
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
CREATE FUNCTION public.update_campaign_dispatch_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if (new.sending_at is not null) and (old.sending_at is null) then
    update public.campaigns
      set first_dispatch_at = coalesce(first_dispatch_at, new.sending_at)
      where id = new.campaign_id;
  end if;
  if (new.sent_at is not null) and (old.sent_at is null) then
    update public.campaigns
      set last_sent_at = greatest(coalesce(last_sent_at, new.sent_at), new.sent_at)
      where id = new.campaign_id;
  end if;
  return new;
end;
$$;
CREATE TABLE public.account_alerts (
    id text DEFAULT concat('alert_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    type text NOT NULL,
    code integer,
    message text NOT NULL,
    details jsonb,
    dismissed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.campaign_batch_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE public.campaign_contacts (
    id text DEFAULT concat('cc_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    campaign_id text NOT NULL,
    contact_id text,
    phone text NOT NULL,
    name text,
    email text,
    status text DEFAULT 'pending'::text,
    message_id text,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    failed_at timestamp with time zone,
    error text,
    failure_code integer,
    failure_reason text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    trace_id text,
    sending_at timestamp with time zone,
    skipped_at timestamp with time zone,
    skip_code text,
    skip_reason text,
    failure_title text,
    failure_details text,
    failure_fbtrace_id text,
    failure_subcode integer,
    failure_href text,
    CONSTRAINT campaign_contacts_skipped_reason_check CHECK (((status <> 'skipped'::text) OR (failure_reason IS NOT NULL) OR (error IS NOT NULL)))
);
CREATE TABLE public.campaign_run_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.campaigns (
    id text DEFAULT concat('c_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'Rascunho'::text NOT NULL,
    template_name text,
    template_id text,
    template_variables jsonb,
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
    qstash_schedule_message_id text,
    qstash_schedule_enqueued_at timestamp with time zone,
    last_sent_at timestamp with time zone,
    first_dispatch_at timestamp with time zone,
    cancelled_at timestamp with time zone
);
CREATE TABLE public.contacts (
    id text DEFAULT concat('ct_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    phone text NOT NULL,
    email text,
    status text DEFAULT 'Opt-in'::text,
    tags jsonb DEFAULT '[]'::jsonb,
    notes text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);
CREATE TABLE public.custom_field_definitions (
    id text DEFAULT concat('cfd_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    options jsonb,
    entity_type text DEFAULT 'contact'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.flow_submissions (
    id text DEFAULT concat('fs_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    message_id text NOT NULL,
    from_phone text NOT NULL,
    contact_id text,
    flow_id text,
    flow_name text,
    flow_token text,
    response_json_raw text NOT NULL,
    response_json jsonb,
    waba_id text,
    phone_number_id text,
    message_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    flow_local_id text,
    mapped_data jsonb,
    mapped_at timestamp with time zone
);
CREATE TABLE public.flows (
    id text DEFAULT concat('fl_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
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
CREATE TABLE public.lead_forms (
    id text DEFAULT concat('lf_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    tag text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    success_message text,
    webhook_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    collect_email boolean DEFAULT true NOT NULL
);
CREATE TABLE public.phone_suppressions (
    id text DEFAULT concat('ps_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    phone text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    reason text,
    source text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone,
    expires_at timestamp with time zone
);
CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.template_project_items (
    id text DEFAULT concat('tpi_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    project_id text NOT NULL,
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
CREATE TABLE public.template_projects (
    id text DEFAULT concat('tp_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    user_id text,
    title text NOT NULL,
    prompt text,
    status text DEFAULT 'draft'::text,
    template_count integer DEFAULT 0,
    approved_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    source text
);
CREATE TABLE public.templates (
    id text DEFAULT concat('tpl_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    name text NOT NULL,
    category text,
    language text DEFAULT 'pt_BR'::text,
    status text,
    components jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    source text DEFAULT 'meta'::text,
    parameter_format text,
    meta_id text,
    rejected_reason text,
    quality_score text,
    fetched_at timestamp with time zone,
    spec_hash text
);
CREATE TABLE public.whatsapp_status_events (
    id text DEFAULT concat('wse_', replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
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
    campaign_contact_id text,
    campaign_id text,
    first_received_at timestamp with time zone DEFAULT now() NOT NULL,
    last_received_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.account_alerts
    ADD CONSTRAINT account_alerts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_batch_metrics
    ADD CONSTRAINT campaign_batch_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_contacts
    ADD CONSTRAINT campaign_contacts_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id);
ALTER TABLE ONLY public.campaign_contacts
    ADD CONSTRAINT campaign_contacts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_run_metrics
    ADD CONSTRAINT campaign_run_metrics_campaign_id_trace_id_key UNIQUE (campaign_id, trace_id);
ALTER TABLE ONLY public.campaign_run_metrics
    ADD CONSTRAINT campaign_run_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_phone_key UNIQUE (phone);
ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_entity_type_key_key UNIQUE (entity_type, key);
ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.flow_submissions
    ADD CONSTRAINT flow_submissions_message_id_key UNIQUE (message_id);
ALTER TABLE ONLY public.flow_submissions
    ADD CONSTRAINT flow_submissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.flows
    ADD CONSTRAINT flows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_forms
    ADD CONSTRAINT lead_forms_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_forms
    ADD CONSTRAINT lead_forms_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.lead_forms
    ADD CONSTRAINT lead_forms_webhook_token_key UNIQUE (webhook_token);
ALTER TABLE ONLY public.phone_suppressions
    ADD CONSTRAINT phone_suppressions_phone_key UNIQUE (phone);
ALTER TABLE ONLY public.phone_suppressions
    ADD CONSTRAINT phone_suppressions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.template_project_items
    ADD CONSTRAINT template_project_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.template_projects
    ADD CONSTRAINT template_projects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_name_key UNIQUE (name);
ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.whatsapp_status_events
    ADD CONSTRAINT whatsapp_status_events_pkey PRIMARY KEY (id);
CREATE INDEX campaign_batch_metrics_campaign_idx ON public.campaign_batch_metrics USING btree (campaign_id, created_at DESC);
CREATE INDEX campaign_batch_metrics_trace_idx ON public.campaign_batch_metrics USING btree (trace_id, batch_index);
CREATE INDEX campaign_run_metrics_campaign_idx ON public.campaign_run_metrics USING btree (campaign_id, created_at DESC);
CREATE INDEX campaign_run_metrics_config_hash_idx ON public.campaign_run_metrics USING btree (config_hash, created_at DESC);
CREATE INDEX campaign_run_metrics_created_idx ON public.campaign_run_metrics USING btree (created_at DESC);
CREATE INDEX campaigns_cancelled_at_idx ON public.campaigns USING btree (cancelled_at);
CREATE INDEX campaigns_first_dispatch_at_idx ON public.campaigns USING btree (first_dispatch_at DESC);
CREATE INDEX campaigns_last_sent_at_idx ON public.campaigns USING btree (last_sent_at DESC);
CREATE INDEX idx_account_alerts_dismissed ON public.account_alerts USING btree (dismissed);
CREATE INDEX idx_account_alerts_dismissed_created ON public.account_alerts USING btree (dismissed, created_at DESC);
CREATE INDEX idx_account_alerts_type ON public.account_alerts USING btree (type);
CREATE INDEX idx_campaign_contacts_campaign ON public.campaign_contacts USING btree (campaign_id);
CREATE INDEX idx_campaign_contacts_campaign_phone ON public.campaign_contacts USING btree (campaign_id, phone);
CREATE INDEX idx_campaign_contacts_failed_recent ON public.campaign_contacts USING btree (campaign_id, failed_at DESC) WHERE (status = 'failed'::text);
CREATE INDEX idx_campaign_contacts_failure ON public.campaign_contacts USING btree (failure_code);
CREATE INDEX idx_campaign_contacts_failure_fbtrace_id ON public.campaign_contacts USING btree (failure_fbtrace_id);
CREATE INDEX idx_campaign_contacts_failure_subcode ON public.campaign_contacts USING btree (failure_subcode);
CREATE INDEX idx_campaign_contacts_failure_title ON public.campaign_contacts USING btree (failure_title);
CREATE INDEX idx_campaign_contacts_message_id ON public.campaign_contacts USING btree (message_id);
CREATE INDEX idx_campaign_contacts_sending_at ON public.campaign_contacts USING btree (sending_at DESC);
CREATE INDEX idx_campaign_contacts_skipped_at ON public.campaign_contacts USING btree (skipped_at DESC);
CREATE INDEX idx_campaign_contacts_status ON public.campaign_contacts USING btree (status);
CREATE INDEX idx_campaign_contacts_trace_id ON public.campaign_contacts USING btree (trace_id);
CREATE INDEX idx_campaigns_created_at ON public.campaigns USING btree (created_at DESC);
CREATE INDEX idx_campaigns_qstash_schedule_message_id ON public.campaigns USING btree (qstash_schedule_message_id);
CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);
CREATE INDEX idx_contacts_custom_fields ON public.contacts USING gin (custom_fields);
CREATE INDEX idx_contacts_phone ON public.contacts USING btree (phone);
CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);
CREATE INDEX idx_contacts_tags_gin ON public.contacts USING gin (tags);
CREATE INDEX idx_custom_field_definitions_entity ON public.custom_field_definitions USING btree (entity_type);
CREATE INDEX idx_flow_submissions_contact_id ON public.flow_submissions USING btree (contact_id);
CREATE INDEX idx_flow_submissions_created_at ON public.flow_submissions USING btree (created_at DESC);
CREATE INDEX idx_flow_submissions_flow_id ON public.flow_submissions USING btree (flow_id);
CREATE INDEX idx_flow_submissions_flow_local_id ON public.flow_submissions USING btree (flow_local_id);
CREATE INDEX idx_flow_submissions_from_phone ON public.flow_submissions USING btree (from_phone);
CREATE INDEX idx_flows_created_at ON public.flows USING btree (created_at DESC);
CREATE INDEX idx_flows_meta_flow_id ON public.flows USING btree (meta_flow_id);
CREATE INDEX idx_flows_meta_status ON public.flows USING btree (meta_status);
CREATE INDEX idx_flows_status ON public.flows USING btree (status);
CREATE INDEX idx_flows_template_key ON public.flows USING btree (template_key);
CREATE INDEX idx_lead_forms_collect_email ON public.lead_forms USING btree (collect_email);
CREATE INDEX idx_lead_forms_is_active ON public.lead_forms USING btree (is_active);
CREATE INDEX idx_lead_forms_slug ON public.lead_forms USING btree (slug);
CREATE INDEX idx_phone_suppressions_active ON public.phone_suppressions USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_phone_suppressions_expires ON public.phone_suppressions USING btree (expires_at) WHERE (expires_at IS NOT NULL);
CREATE INDEX idx_phone_suppressions_phone ON public.phone_suppressions USING btree (phone);
CREATE INDEX idx_template_project_items_project ON public.template_project_items USING btree (project_id);
CREATE INDEX idx_template_project_items_status ON public.template_project_items USING btree (status);
CREATE INDEX idx_template_projects_source ON public.template_projects USING btree (source);
CREATE INDEX idx_template_projects_status ON public.template_projects USING btree (status);
CREATE INDEX idx_templates_name ON public.templates USING btree (name);
CREATE INDEX idx_templates_source ON public.templates USING btree (source);
CREATE INDEX idx_templates_status ON public.templates USING btree (status);
CREATE INDEX idx_templates_status_source ON public.templates USING btree (status, source);
CREATE INDEX idx_whatsapp_status_events_apply_state ON public.whatsapp_status_events USING btree (apply_state);
CREATE INDEX idx_whatsapp_status_events_last_received_at ON public.whatsapp_status_events USING btree (last_received_at DESC);
CREATE INDEX idx_whatsapp_status_events_message_id ON public.whatsapp_status_events USING btree (message_id);
CREATE INDEX lead_forms_fields_gin_idx ON public.lead_forms USING gin (fields);
CREATE UNIQUE INDEX ux_whatsapp_status_events_dedupe_key ON public.whatsapp_status_events USING btree (dedupe_key);
CREATE TRIGGER trg_campaign_contacts_dispatch_metrics AFTER UPDATE OF sending_at, sent_at ON public.campaign_contacts FOR EACH ROW EXECUTE FUNCTION public.update_campaign_dispatch_metrics();
ALTER TABLE ONLY public.campaign_contacts
    ADD CONSTRAINT campaign_contacts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_contacts
    ADD CONSTRAINT campaign_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.flow_submissions
    ADD CONSTRAINT flow_submissions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.flow_submissions
    ADD CONSTRAINT flow_submissions_flow_local_id_fkey FOREIGN KEY (flow_local_id) REFERENCES public.flows(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.template_project_items
    ADD CONSTRAINT template_project_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.template_projects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.whatsapp_status_events
    ADD CONSTRAINT whatsapp_status_events_campaign_contact_id_fkey FOREIGN KEY (campaign_contact_id) REFERENCES public.campaign_contacts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.whatsapp_status_events
    ADD CONSTRAINT whatsapp_status_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
DO $$
BEGIN
    -- A publication supabase_realtime costuma ser gerenciada/provida pelo Supabase Realtime.
    -- Não criamos aqui para evitar falhas de permissão ou "already exists".
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'account_alerts') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.account_alerts;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaign_contacts') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_contacts;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaigns') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contacts') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'custom_field_definitions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_field_definitions;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'template_project_items') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.template_project_items;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'template_projects') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.template_projects;
        END IF;
    ELSE
        RAISE NOTICE 'Publication supabase_realtime não existe; pulando ALTER PUBLICATION.';
    END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON FUNCTION public.increment_campaign_stat(campaign_id_input text, field text) TO service_role;
GRANT ALL ON FUNCTION public.increment_campaign_stat(campaign_id_input text, field text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_campaign_stat(campaign_id_input text, field text) TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.account_alerts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.account_alerts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.account_alerts TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaign_contacts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaign_contacts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaign_contacts TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaigns TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaigns TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.campaigns TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.contacts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.contacts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.contacts TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.custom_field_definitions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.custom_field_definitions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.custom_field_definitions TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settings TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_project_items TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_project_items TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_project_items TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_projects TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_projects TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.template_projects TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.templates TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.templates TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.templates TO service_role;
