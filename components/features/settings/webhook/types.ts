import { PhoneNumber } from '../../../../hooks/useSettings';

export interface WebhookStats {
  lastEventAt?: string | null;
  todayDelivered?: number;
  todayRead?: number;
  todayFailed?: number;
}

export interface DomainOption {
  url: string;
  source: string;
  recommended: boolean;
}

export interface WebhookSubscription {
  ok: boolean;
  wabaId?: string;
  messagesSubscribed?: boolean;
  subscribedFields?: string[];
  error?: string;
}

export interface WebhookStatus {
  status: 'smartzap' | 'other' | 'waba' | 'app' | 'none';
  url: string | null;
  level: number;
  levelName: string;
  levelDescription: string;
}

export interface WebhookFunnelLevel {
  level: number;
  name: string;
  url: string | null;
  isActive: boolean;
  isSmartZap: boolean;
  color: 'emerald' | 'blue' | 'zinc';
  description: string;
  isLocked?: boolean;
}

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

export type CardColor = 'emerald' | 'amber' | 'blue' | 'zinc';
