'use client';

import React from 'react';
import type { WizardStepCalendarSelectionProps } from './types';

export function WizardStepCalendarSelection({
  calendarAuthStatus,
  calendarList,
  calendarListLoading,
  calendarListError,
  calendarSelectionId,
  calendarSelectionSaving,
  calendarListQuery,
  filteredCalendarList,
  selectedCalendarTimeZone,
  setCalendarSelectionId,
  setCalendarListQuery,
  fetchCalendarList,
  handleSaveCalendarSelection,
}: WizardStepCalendarSelectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">3) Escolha o calendario</div>
          <div className="text-xs text-gray-400">Usamos este calendario para disponibilidade e eventos.</div>
          {selectedCalendarTimeZone && (
            <div className="mt-2 text-xs text-gray-300">
              Fuso horario: <span className="font-mono text-white">{selectedCalendarTimeZone}</span>
            </div>
          )}
        </div>
        {calendarAuthStatus?.connected && calendarAuthStatus?.calendar?.calendarSummary && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
            {calendarAuthStatus.calendar.calendarSummary}
          </span>
        )}
      </div>

      {!calendarAuthStatus?.connected ? (
        <div className="mt-3 text-xs text-gray-500">Conecte o Google Calendar para escolher.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {calendarListLoading ? (
            <div className="text-xs text-gray-400">Carregando calendarios...</div>
          ) : calendarListError ? (
            <div className="text-xs text-red-400">{calendarListError}</div>
          ) : (
            <>
              {calendarList.length === 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs text-gray-500">Nenhum calendario encontrado.</div>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r/settings/createcalendar"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-200 hover:text-emerald-100"
                  >
                    Criar novo calendario
                  </a>
                  <button
                    type="button"
                    onClick={fetchCalendarList}
                    className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                  >
                    Atualizar lista
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={calendarListQuery}
                    onChange={(e) => setCalendarListQuery(e.target.value)}
                    placeholder="Buscar calendario..."
                    className="h-9 w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-xs text-white"
                  />
                  {filteredCalendarList.length === 0 ? (
                    <div className="text-xs text-gray-500">Nenhum calendario com esse filtro.</div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={calendarSelectionId}
                        onChange={(e) => setCalendarSelectionId(e.target.value)}
                        className="h-9 rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-xs text-white"
                      >
                        {filteredCalendarList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.summary || item.id}
                            {item.primary ? ' (principal)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={fetchCalendarList}
                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                      >
                        Atualizar lista
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCalendarSelection}
                        disabled={!calendarSelectionId || calendarSelectionSaving}
                        className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {calendarSelectionSaving ? 'Salvando...' : 'Salvar calendario'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
