import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppSettings, CalendarBookingConfig, WorkflowExecutionConfig } from '../../../types';
import { AccountLimits } from '../../../lib/meta-limits';
import { PhoneNumber } from '../../../hooks/useSettings';
import { AISettings } from './AISettings';
import { TestContactPanel } from './TestContactPanel';
import { AutoSuppressionPanel } from './AutoSuppressionPanel';
import { WorkflowExecutionPanel } from './WorkflowExecutionPanel';
import { MetaAppPanel } from './MetaAppPanel';
import { StatusCard } from './StatusCard';
import { TurboConfigSection } from './TurboConfigSection';
import { WebhookConfigSection } from './WebhookConfigSection';
import { CalendarBookingPanel } from './CalendarBookingPanel';
import type { AiFallbackConfig, AiPromptsConfig, AiRoutesConfig } from '../../../lib/ai/ai-center-defaults';

interface WebhookStats {
  lastEventAt?: string | null;
  todayDelivered?: number;
  todayRead?: number;
  todayFailed?: number;
}

interface DomainOption {
  url: string;
  source: string;
  recommended: boolean;
}

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSaveSettings: (settings: AppSettings) => void; // Direct save with settings
  onDisconnect: () => void;
  accountLimits?: AccountLimits | null;
  tierName?: string | null;
  limitsError?: boolean;
  limitsErrorMessage?: string | null;
  limitsLoading?: boolean;
  onRefreshLimits?: () => void;
  // Webhook props
  webhookUrl?: string;
  webhookToken?: string;
  webhookStats?: WebhookStats | null;
  webhookSubscription?: {
    ok: boolean;
    wabaId?: string;
    messagesSubscribed?: boolean;
    subscribedFields?: string[];
    apps?: Array<{ id?: string; name?: string; subscribed_fields?: string[] }>;
    error?: string;
    details?: unknown;
  };
  webhookSubscriptionLoading?: boolean;
  webhookSubscriptionMutating?: boolean;
  onRefreshWebhookSubscription?: () => void;
  onSubscribeWebhookMessages?: () => Promise<void>;
  onUnsubscribeWebhookMessages?: () => Promise<void>;
  // Phone numbers for webhook override
  phoneNumbers?: PhoneNumber[];
  phoneNumbersLoading?: boolean;
  onRefreshPhoneNumbers?: () => void;
  onSetWebhookOverride?: (phoneNumberId: string, callbackUrl: string) => Promise<boolean>;
  onRemoveWebhookOverride?: (phoneNumberId: string) => Promise<boolean>;
  // Domain selection
  availableDomains?: DomainOption[];
  webhookPath?: string;
  // Hide header (when shown externally)
  hideHeader?: boolean;

  // Test connection (sem salvar)
  onTestConnection?: () => void;
  isTestingConnection?: boolean;

  // AI Settings
  aiSettings?: {
    isConfigured: boolean;
    source: 'database' | 'env' | 'none';
    tokenPreview?: string | null;
    provider?: 'google' | 'openai' | 'anthropic';
    model?: string;
    providers?: {
      google: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
      openai: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
      anthropic: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
    };
  };
  aiSettingsLoading?: boolean;
  saveAIConfig?: (data: {
    apiKey?: string;
    apiKeyProvider?: string;
    provider?: string;
    model?: string;
    routes?: AiRoutesConfig;
    prompts?: AiPromptsConfig;
    fallback?: AiFallbackConfig;
  }) => Promise<void>;
  removeAIKey?: (provider: 'google' | 'openai' | 'anthropic') => Promise<void>;
  isSavingAI?: boolean;

  // Meta App (opcional) — debug_token no diagnóstico
  metaApp?: {
    source: 'db' | 'env' | 'none';
    appId: string | null;
    hasAppSecret: boolean;
    isConfigured: boolean;
  } | null;
  metaAppLoading?: boolean;
  refreshMetaApp?: () => void;
  // Test Contact - Supabase
  testContact?: { name?: string; phone: string } | null;
  saveTestContact?: (contact: { name?: string; phone: string }) => Promise<void>;
  removeTestContact?: () => Promise<void>;
  isSavingTestContact?: boolean;

  // WhatsApp Turbo (Adaptive Throttle)
  whatsappThrottle?: {
    ok: boolean;
    source?: 'db' | 'env';
    phoneNumberId?: string | null;
    config?: {
      enabled: boolean;
      sendConcurrency?: number;
      batchSize?: number;
      startMps: number;
      maxMps: number;
      minMps: number;
      cooldownSec: number;
      minIncreaseGapSec: number;
      sendFloorDelayMs: number;
    };
    state?: {
      targetMps: number;
      cooldownUntil?: string | null;
      lastIncreaseAt?: string | null;
      lastDecreaseAt?: string | null;
      updatedAt?: string | null;
    } | null;
  } | null;
  whatsappThrottleLoading?: boolean;
  saveWhatsAppThrottle?: (data: {
    enabled?: boolean;
    sendConcurrency?: number;
    batchSize?: number;
    startMps?: number;
    maxMps?: number;
    minMps?: number;
    cooldownSec?: number;
    minIncreaseGapSec?: number;
    sendFloorDelayMs?: number;
    resetState?: boolean;
  }) => Promise<void>;
  isSavingWhatsAppThrottle?: boolean;

  // Auto-supressão (Proteção de Qualidade)
  autoSuppression?: {
    ok: boolean;
    source?: 'db' | 'default';
    config?: {
      enabled: boolean;
      undeliverable131026: {
        enabled: boolean;
        windowDays: number;
        threshold: number;
        ttlBaseDays: number;
        ttl2Days: number;
        ttl3Days: number;
      };
    };
  } | null;
  autoSuppressionLoading?: boolean;
  saveAutoSuppression?: (data: {
    enabled?: boolean;
    undeliverable131026?: {
      enabled?: boolean;
      windowDays?: number;
      threshold?: number;
      ttlBaseDays?: number;
      ttl2Days?: number;
      ttl3Days?: number;
    };
  }) => Promise<void>;
  isSavingAutoSuppression?: boolean;

  // Calendar Booking (Google Calendar)
  calendarBooking?: {
    ok: boolean;
    source?: 'db' | 'default';
    config?: CalendarBookingConfig;
  } | null;
  calendarBookingLoading?: boolean;
  saveCalendarBooking?: (data: Partial<CalendarBookingConfig>) => Promise<void>;
  isSavingCalendarBooking?: boolean;

  // Workflow Execution (global)
  workflowExecution?: {
    ok: boolean;
    source: 'db' | 'env';
    config: WorkflowExecutionConfig;
  } | null;
  workflowExecutionLoading?: boolean;
  saveWorkflowExecution?: (data: Partial<WorkflowExecutionConfig>) => Promise<WorkflowExecutionConfig | void>;
  isSavingWorkflowExecution?: boolean;

  // Workflow Builder default
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  isLoading,
  isSaving,
  onSave,
  onSaveSettings,
  onDisconnect,
  accountLimits,
  tierName,
  limitsError,
  limitsErrorMessage,
  limitsLoading,
  onRefreshLimits,
  webhookUrl,
  webhookToken,
  webhookStats,
  webhookSubscription,
  webhookSubscriptionLoading,
  webhookSubscriptionMutating,
  onRefreshWebhookSubscription,
  onSubscribeWebhookMessages,
  onUnsubscribeWebhookMessages,
  phoneNumbers,
  phoneNumbersLoading,
  onRefreshPhoneNumbers,
  onSetWebhookOverride,
  onRemoveWebhookOverride,
  availableDomains,
  webhookPath,
  hideHeader,

  onTestConnection,
  isTestingConnection,

  // AI Props
  aiSettings,
  aiSettingsLoading,
  saveAIConfig,
  removeAIKey,
  isSavingAI,

  // Meta App
  metaApp,
  metaAppLoading,
  refreshMetaApp,
  // Test Contact Props - Supabase
  testContact,
  saveTestContact,
  removeTestContact,
  isSavingTestContact,

  // Turbo
  whatsappThrottle,
  whatsappThrottleLoading,
  saveWhatsAppThrottle,
  isSavingWhatsAppThrottle,

  // Auto-supressão
  autoSuppression,
  autoSuppressionLoading,
  saveAutoSuppression,
  isSavingAutoSuppression,

  // Calendar Booking
  calendarBooking,
  calendarBookingLoading,
  saveCalendarBooking,
  isSavingCalendarBooking,

  // Workflow Execution (global)
  workflowExecution,
  workflowExecutionLoading,
  saveWorkflowExecution,
  isSavingWorkflowExecution,

}) => {
  // Always start collapsed
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Refs para UX: o formulário de credenciais fica bem abaixo do card.
  // Sem scroll automático, parece que o botão "Editar" não funcionou.
  const statusCardRef = useRef<HTMLDivElement | null>(null);
  const credentialsFormRef = useRef<HTMLDivElement | null>(null);

  // Meta App ID (rápido) — usado para uploads do Template Builder (header_handle)
  const [metaAppIdQuick, setMetaAppIdQuick] = useState('');

  useEffect(() => {
    setMetaAppIdQuick(metaApp?.appId || '');
  }, [metaApp?.appId]);

  useEffect(() => {
    // Quando o usuário ativa o modo edição, rolar até o formulário.
    if (!isEditing) return;

    // Aguarda o render do bloco condicional.
    const t = window.setTimeout(() => {
      credentialsFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    return () => window.clearTimeout(t);
  }, [isEditing]);

  if (isLoading) return <div className="text-white">Carregando configurações...</div>;

  return (
    <div>
      {!hideHeader && (
        <>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Configurações</h1>
          <p className="text-gray-400 mb-10">Gerencie sua conexão com a WhatsApp Business API</p>
        </>
      )}

      <div className="space-y-8">
        {/* Status Card */}
        <StatusCard
          ref={statusCardRef}
          settings={settings}
          limitsLoading={limitsLoading}
          limitsError={limitsError}
          limitsErrorMessage={limitsErrorMessage}
          accountLimits={accountLimits}
          onRefreshLimits={onRefreshLimits}
          onDisconnect={onDisconnect}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((v) => !v)}
        />

        {/* AI Settings Section - New! */}
        {settings.isConnected && saveAIConfig && (
          <AISettings
            settings={aiSettings}
            isLoading={!!aiSettingsLoading}
            onSave={saveAIConfig}
            onRemoveKey={removeAIKey}
            isSaving={!!isSavingAI}
          />
        )}

        {/* Meta App (opcional) — debug_token e diagnóstico avançado */}
        {settings.isConnected && (
          <MetaAppPanel
            metaApp={metaApp}
            metaAppLoading={metaAppLoading}
            refreshMetaApp={refreshMetaApp}
          />
        )}

        {/* Form - Only visible if disconnected OR editing */}
        {(!settings.isConnected || isEditing) && (
          <div ref={credentialsFormRef} className="glass-panel rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300 scroll-mt-24">
            <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              Configuração da API
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID do Número de Telefone <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={settings.phoneNumberId}
                    onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                    placeholder="ex: 298347293847"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors" title="Encontrado no Meta Business Manager">
                    <HelpCircle size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID da Conta Comercial (Business ID) <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={settings.businessAccountId}
                    onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })}
                    placeholder="ex: 987234987234"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors" title="Encontrado no Meta Business Manager">
                    <HelpCircle size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token de Acesso do Usuário do Sistema <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={settings.accessToken}
                    onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                    placeholder="EAAG........"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20 tracking-widest"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-mono">Armazenamento criptografado SHA-256.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta App ID <span className="text-gray-500">(opcional)</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={metaAppIdQuick}
                    onChange={(e) => setMetaAppIdQuick(e.target.value)}
                    placeholder="ex: 123456789012345"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div
                    className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors"
                    title="Necessário para upload de mídia no header do Template Builder (Resumable Upload API)."
                  >
                    <HelpCircle size={16} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Usado apenas para gerar <span className="font-mono">header_handle</span> (upload de imagem/vídeo/documento/GIF) no Template Builder.
                </p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex justify-end gap-4">
              <button
                className="h-10 px-6 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={() => onTestConnection?.()}
                disabled={!!isTestingConnection}
              >
                {isTestingConnection ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                {isTestingConnection ? 'Testando…' : 'Testar Conexão'}
              </button>
              <button
                className="h-10 px-8 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                onClick={() => {
                  onSave();
                  setIsEditing(false);

                  // Best-effort: salva Meta App ID junto, sem bloquear o salvamento do WhatsApp.
                  const nextAppId = metaAppIdQuick.trim();
                  const currentAppId = String(metaApp?.appId || '').trim();
                  if (nextAppId && nextAppId !== currentAppId) {
                    fetch('/api/settings/meta-app', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ appId: nextAppId }),
                    })
                      .then(async (res) => {
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error((json as any)?.error || 'Falha ao salvar Meta App ID');
                        refreshMetaApp?.();
                      })
                      .catch((e) => {
                        // Não bloqueia o fluxo principal.
                        toast.warning(e instanceof Error ? e.message : 'Falha ao salvar Meta App ID');
                      });
                  }
                }}
                disabled={isSaving}
              >
                <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Config'}
              </button>
            </div>
          </div>
        )}

        {/* Workflow Builder Default moved to /workflows */}

        {/* Calendar Booking Section */}
        {settings.isConnected && (
          <CalendarBookingPanel
            isConnected={settings.isConnected}
            calendarBooking={calendarBooking}
            calendarBookingLoading={calendarBookingLoading}
            saveCalendarBooking={saveCalendarBooking}
            isSavingCalendarBooking={isSavingCalendarBooking}
          />
        )}

        {/* Test Contact Section */}
        {settings.isConnected && (
          <TestContactPanel
            testContact={testContact}
            saveTestContact={saveTestContact}
            removeTestContact={removeTestContact}
            isSaving={isSavingTestContact}
          />
        )}

        {/* WhatsApp Turbo (Adaptive Throttle) */}
        {settings.isConnected && saveWhatsAppThrottle && (
          <TurboConfigSection
            whatsappThrottle={whatsappThrottle}
            whatsappThrottleLoading={whatsappThrottleLoading}
            saveWhatsAppThrottle={saveWhatsAppThrottle}
            isSaving={isSavingWhatsAppThrottle}
            settings={settings}
          />
        )}

        {/* Proteção de Qualidade (Auto-supressão) */}
        {settings.isConnected && saveAutoSuppression && (
          <AutoSuppressionPanel
            autoSuppression={autoSuppression}
            autoSuppressionLoading={autoSuppressionLoading}
            saveAutoSuppression={saveAutoSuppression}
            isSaving={isSavingAutoSuppression}
          />
        )}

        {/* Execução do workflow (global) */}
        {settings.isConnected && saveWorkflowExecution && (
          <WorkflowExecutionPanel
            workflowExecution={workflowExecution}
            workflowExecutionLoading={workflowExecutionLoading}
            saveWorkflowExecution={saveWorkflowExecution}
            isSaving={isSavingWorkflowExecution}
          />
        )}


        {/* Webhook Configuration Section */}
        {settings.isConnected && webhookUrl && (
          <WebhookConfigSection
            webhookUrl={webhookUrl}
            webhookToken={webhookToken}
            webhookStats={webhookStats}
            webhookPath={webhookPath}
            webhookSubscription={webhookSubscription}
            webhookSubscriptionLoading={webhookSubscriptionLoading}
            webhookSubscriptionMutating={webhookSubscriptionMutating}
            onRefreshWebhookSubscription={onRefreshWebhookSubscription}
            onSubscribeWebhookMessages={onSubscribeWebhookMessages}
            onUnsubscribeWebhookMessages={onUnsubscribeWebhookMessages}
            phoneNumbers={phoneNumbers}
            phoneNumbersLoading={phoneNumbersLoading}
            onRefreshPhoneNumbers={onRefreshPhoneNumbers}
            onSetWebhookOverride={onSetWebhookOverride}
            onRemoveWebhookOverride={onRemoveWebhookOverride}
            availableDomains={availableDomains}
          />
        )}
      </div>
    </div>
  );
};
