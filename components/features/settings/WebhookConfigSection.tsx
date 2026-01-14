'use client';

import React, { useState } from 'react';
import { Webhook, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneNumber } from '../../../hooks/useSettings';

import {
  WebhookUrlConfig,
  WebhookSubscriptionStatus,
  PhoneNumbersList,
  WebhookLevelsExplanation,
  WebhookStats,
  DomainOption,
  WebhookSubscription,
} from './webhook';

export interface WebhookConfigSectionProps {
  webhookUrl?: string;
  webhookToken?: string;
  webhookStats?: WebhookStats | null;
  webhookPath?: string;
  webhookSubscription?: WebhookSubscription | null;
  webhookSubscriptionLoading?: boolean;
  webhookSubscriptionMutating?: boolean;
  onRefreshWebhookSubscription?: () => void;
  onSubscribeWebhookMessages?: () => Promise<void>;
  onUnsubscribeWebhookMessages?: () => Promise<void>;
  phoneNumbers?: PhoneNumber[];
  phoneNumbersLoading?: boolean;
  onRefreshPhoneNumbers?: () => void;
  onSetWebhookOverride?: (phoneNumberId: string, callbackUrl: string) => Promise<boolean>;
  onRemoveWebhookOverride?: (phoneNumberId: string) => Promise<boolean>;
  availableDomains?: DomainOption[];
}

export function WebhookConfigSection({
  webhookUrl,
  webhookToken,
  webhookStats,
  webhookPath,
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
}: WebhookConfigSectionProps) {
  // Local states
  const [selectedDomainUrl, setSelectedDomainUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Computed webhook URL based on domain selection
  const defaultPath = '/api/webhook';
  const computedWebhookUrl = selectedDomainUrl
    ? selectedDomainUrl + (webhookPath || defaultPath)
    : webhookUrl;

  // Handlers
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleSetZapflowWebhook = async (phoneNumberId: string) => {
    const urlToSet = computedWebhookUrl;
    if (!urlToSet) return;

    setIsSavingOverride(true);
    try {
      await onSetWebhookOverride?.(phoneNumberId, urlToSet);
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleRemoveOverride = async (phoneNumberId: string) => {
    setIsSavingOverride(true);
    try {
      await onRemoveWebhookOverride?.(phoneNumberId);
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleSetCustomOverride = async (phoneNumberId: string, url: string) => {
    if (!url.trim()) {
      toast.error('Digite a URL do webhook');
      return;
    }

    if (!url.startsWith('https://')) {
      toast.error('A URL deve começar com https://');
      return;
    }

    const success = await onSetWebhookOverride?.(phoneNumberId, url.trim());
    return success;
  };

  return (
    <div className="glass-panel rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
          <Webhook size={20} className="text-blue-400" />
          Webhooks
        </h3>
        {phoneNumbers && phoneNumbers.length > 0 && (
          <button
            onClick={onRefreshPhoneNumbers}
            disabled={phoneNumbersLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={phoneNumbersLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-6">
        Webhooks são notificações que a Meta envia quando algo acontece (mensagem entregue, lida, etc).
      </p>

      {/* SmartZap Webhook URL Config */}
      <WebhookUrlConfig
        webhookUrl={computedWebhookUrl}
        webhookToken={webhookToken}
        webhookStats={webhookStats}
        availableDomains={availableDomains}
        selectedDomainUrl={selectedDomainUrl}
        onDomainChange={setSelectedDomainUrl}
        copiedField={copiedField}
        onCopy={handleCopy}
      />

      {/* Meta Subscription Status */}
      <WebhookSubscriptionStatus
        webhookSubscription={webhookSubscription}
        webhookSubscriptionLoading={webhookSubscriptionLoading}
        webhookSubscriptionMutating={webhookSubscriptionMutating}
        onRefresh={onRefreshWebhookSubscription}
        onSubscribe={onSubscribeWebhookMessages}
        onUnsubscribe={onUnsubscribeWebhookMessages}
      />

      {/* Phone Numbers List */}
      {phoneNumbers && phoneNumbers.length > 0 && (
        <PhoneNumbersList
          phoneNumbers={phoneNumbers}
          phoneNumbersLoading={phoneNumbersLoading}
          computedWebhookUrl={computedWebhookUrl}
          isSavingOverride={isSavingOverride}
          onSetZapflowWebhook={handleSetZapflowWebhook}
          onRemoveOverride={handleRemoveOverride}
          onSetCustomOverride={handleSetCustomOverride}
        />
      )}

      {/* Webhook Levels Explanation */}
      <WebhookLevelsExplanation />
    </div>
  );
}
