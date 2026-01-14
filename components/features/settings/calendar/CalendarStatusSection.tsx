'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { CalendarStatusSectionProps } from './types';

export function CalendarStatusSection({
  calendarAuthLoading,
  calendarAuthStatus,
  calendarTestLoading,
  calendarTestResult,
  handlePrimaryCalendarAction,
  handleCalendarTestEvent,
  setCalendarWizardStep,
  setCalendarWizardError,
  setIsCalendarWizardOpen,
}: CalendarStatusSectionProps) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Google Calendar</div>
          <div className="mt-1 text-xs text-gray-400">
            {calendarAuthLoading
              ? 'Verificando...'
              : calendarAuthStatus?.connected
                ? 'Conectado'
                : 'Desconectado'}
          </div>
          {calendarAuthStatus?.calendar?.calendarSummary && (
            <div className="mt-2 text-xs text-gray-400">
              Calendario: {calendarAuthStatus.calendar.calendarSummary}
            </div>
          )}
          {calendarAuthStatus?.connected && (
            <div className="mt-2 text-xs text-gray-400">
              Conta: {calendarAuthStatus?.calendar?.accountEmail || 'nao disponivel'}
            </div>
          )}
          {calendarTestResult?.ok && calendarTestResult?.link && (
            <a
              href={calendarTestResult.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200 hover:text-emerald-100"
            >
              <ExternalLink size={12} />
              Evento de teste criado
            </a>
          )}
          {calendarTestResult?.ok === false && (
            <div className="mt-2 text-xs text-red-400">
              Falha ao criar evento de teste.
            </div>
          )}
          {!calendarAuthStatus?.connected && (
            <div className="mt-2 text-xs text-gray-500">
              Conecte uma vez para liberar o agendamento no WhatsApp.
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrimaryCalendarAction}
            className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
          >
            {calendarAuthStatus?.connected ? 'Gerenciar conexao' : 'Conectar Google Calendar'}
          </button>
          {calendarAuthStatus?.connected && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCalendarWizardStep(3);
                  setCalendarWizardError(null);
                  setIsCalendarWizardOpen(true);
                }}
                className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
              >
                Trocar calendario
              </button>
              <button
                type="button"
                onClick={handleCalendarTestEvent}
                disabled={calendarTestLoading}
                className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {calendarTestLoading ? 'Testando...' : 'Testar evento'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
