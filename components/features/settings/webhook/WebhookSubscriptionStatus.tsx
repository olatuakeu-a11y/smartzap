'use client';

import React from 'react';
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  Trash2,
} from 'lucide-react';
import { WebhookSubscription } from './types';

interface WebhookSubscriptionStatusProps {
  webhookSubscription?: WebhookSubscription | null;
  webhookSubscriptionLoading?: boolean;
  webhookSubscriptionMutating?: boolean;
  onRefresh?: () => void;
  onSubscribe?: () => Promise<void>;
  onUnsubscribe?: () => Promise<void>;
}

export function WebhookSubscriptionStatus({
  webhookSubscription,
  webhookSubscriptionLoading,
  webhookSubscriptionMutating,
  onRefresh,
  onSubscribe,
  onUnsubscribe,
}: WebhookSubscriptionStatusProps) {
  const handleSubscribe = async () => {
    if (!onSubscribe) return;
    try {
      await onSubscribe();
    } catch {
      // toast handled in controller
    }
  };

  const handleUnsubscribe = async () => {
    if (!onUnsubscribe) return;
    try {
      await onUnsubscribe();
    } catch {
      // toast handled in controller
    }
  };

  const isLoading = webhookSubscriptionLoading || webhookSubscriptionMutating;

  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-white mb-1 flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-400" />
            Inscrição do webhook (campo:{' '}
            <span className="font-mono text-xs text-emerald-300">messages</span>)
          </h4>
          <p className="text-xs text-gray-400">
            Isso autoriza a Meta a enviar eventos de <strong>mensagens</strong> para o seu
            webhook. É independente do override do número (Prioridade #1).
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Atualizar status"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm">
          {webhookSubscriptionLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-gray-400" />
              <span className="text-gray-400">Consultando status…</span>
            </>
          ) : webhookSubscription?.ok ? (
            webhookSubscription.messagesSubscribed ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-emerald-300">Ativo</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400 text-xs">
                  WABA: {webhookSubscription.wabaId}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-amber-400" />
                <span className="text-amber-300">Inativo (via API)</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400 text-xs">
                  WABA: {webhookSubscription.wabaId}
                </span>
              </>
            )
          ) : (
            <>
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-red-300">Erro ao consultar</span>
            </>
          )}
        </div>

        {webhookSubscription && !webhookSubscriptionLoading && webhookSubscription.ok && (
          <div className="text-[11px] text-gray-500">
            Campos ativos:{' '}
            {webhookSubscription.subscribedFields?.length
              ? webhookSubscription.subscribedFields.join(', ')
              : '—'}
          </div>
        )}

        {webhookSubscription &&
          !webhookSubscriptionLoading &&
          webhookSubscription.ok &&
          !webhookSubscription.messagesSubscribed && (
            <div className="text-[11px] text-amber-300/70 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Se no painel da Meta estiver "Ativo" e aqui não, pode haver atraso de propagação
              ou permissões do token. Clique em "Atualizar status" ou use "Ativar messages"
              para forçar via API.
            </div>
          )}

        {webhookSubscription &&
          !webhookSubscriptionLoading &&
          !webhookSubscription.ok &&
          webhookSubscription.error && (
            <div className="text-xs text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {webhookSubscription.error}
            </div>
          )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSubscribe}
            disabled={isLoading || !onSubscribe}
            className="h-10 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            title="Inscrever messages via API"
          >
            {webhookSubscriptionMutating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Ativar messages
          </button>

          <button
            onClick={handleUnsubscribe}
            disabled={isLoading || !onUnsubscribe}
            className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            title="Desinscrever (remover subscription)"
          >
            {webhookSubscriptionMutating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Remover inscrição
          </button>
        </div>
      </div>
    </div>
  );
}
