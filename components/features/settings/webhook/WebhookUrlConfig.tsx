'use client';

import React from 'react';
import { Zap, Copy, Check } from 'lucide-react';
import { DomainOption, WebhookStats } from './types';

interface WebhookUrlConfigProps {
  webhookUrl?: string;
  webhookToken?: string;
  webhookStats?: WebhookStats | null;
  availableDomains?: DomainOption[];
  selectedDomainUrl: string;
  onDomainChange: (url: string) => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export function WebhookUrlConfig({
  webhookUrl,
  webhookToken,
  webhookStats,
  availableDomains,
  selectedDomainUrl,
  onDomainChange,
  copiedField,
  onCopy,
}: WebhookUrlConfigProps) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
      <h4 className="font-medium text-blue-300 mb-3 flex items-center gap-2">
        <Zap size={16} />
        URL do Webhook SmartZap
      </h4>

      {/* Domain Selector - only show if multiple domains available */}
      {availableDomains && availableDomains.length > 1 && (
        <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Selecione o domínio para o webhook:
          </label>
          <select
            value={selectedDomainUrl}
            onChange={(e) => onDomainChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
          >
            <option value="">Automático (recomendado)</option>
            {availableDomains.map((domain) => (
              <option key={domain.url} value={domain.url}>
                {domain.url} {domain.recommended ? '★' : ''} ({domain.source})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Escolha qual domínio usar na URL do webhook. O ★ indica o recomendado.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg font-mono text-sm text-gray-300 break-all">
            {webhookUrl}
          </code>
          <button
            onClick={() => onCopy(webhookUrl || '', 'url')}
            className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors shrink-0"
            title="Copiar URL"
          >
            {copiedField === 'url' ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Token:</span>
          <code className="px-2 py-1 bg-zinc-900/50 rounded text-xs font-mono text-gray-400">
            {webhookToken}
          </code>
          <button
            onClick={() => onCopy(webhookToken || '', 'token')}
            className="p-1 hover:bg-white/5 rounded transition-colors"
            title="Copiar Token"
          >
            {copiedField === 'token' ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Webhook Status */}
      {webhookStats?.lastEventAt && (
        <div className="mt-3 pt-3 border-t border-blue-500/20 flex items-center gap-2 text-xs text-blue-300/70">
          <Check size={12} className="text-emerald-400" />
          Último evento: {new Date(webhookStats.lastEventAt).toLocaleString('pt-BR')}
          <span className="text-gray-500">·</span>
          <span>{webhookStats.todayDelivered || 0} delivered</span>
          <span className="text-gray-500">·</span>
          <span>{webhookStats.todayRead || 0} read</span>
        </div>
      )}
    </div>
  );
}
