'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { WizardStepConnectProps } from './types';

export function WizardStepConnect({
  calendarCredsStatus,
  calendarAuthStatus,
  calendarConnectLoading,
  handleConnectCalendar,
  handleDisconnectCalendar,
  fetchCalendarAuthStatus,
}: WizardStepConnectProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">2) Conectar</div>
          <div className="text-xs text-gray-400">Abra o Google e autorize o acesso.</div>
          {calendarAuthStatus?.connected && (
            <div className="mt-2 text-xs text-gray-300">
              Conta conectada:{' '}
              <span className="font-mono text-white">
                {calendarAuthStatus?.calendar?.accountEmail || 'nao disponivel'}
              </span>
            </div>
          )}
        </div>
        {calendarAuthStatus?.connected && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">Conectado</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleConnectCalendar}
          disabled={!calendarCredsStatus?.isConfigured}
          className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {calendarConnectLoading && <Loader2 className="mr-2 size-3 animate-spin" />}
          {calendarConnectLoading ? 'Abrindo Google...' : calendarAuthStatus?.connected ? 'Reautorizar no Google' : 'Autorizar no Google'}
        </button>
        <button
          type="button"
          onClick={fetchCalendarAuthStatus}
          className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
        >
          Verificar status
        </button>
        {calendarAuthStatus?.connected && (
          <button
            type="button"
            onClick={handleDisconnectCalendar}
            className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
          >
            Desconectar
          </button>
        )}
        {!calendarCredsStatus?.isConfigured && (
          <span className="text-[11px] text-gray-500">Adicione as credenciais primeiro.</span>
        )}
      </div>

      {!calendarAuthStatus?.connected && (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-gray-400">
          <div className="text-[11px] font-semibold text-gray-300">Causas comuns</div>
          <div className="mt-2 space-y-1">
            <div>1. Redirect URI diferente do cadastrado.</div>
            <div>2. API nao habilitada no projeto.</div>
            <div>3. Client ID/Secret incorretos.</div>
          </div>
        </div>
      )}
      <div className="text-[11px] text-gray-500">
        Ao concluir, criamos um evento de teste de 30 minutos.
      </div>
    </div>
  );
}
