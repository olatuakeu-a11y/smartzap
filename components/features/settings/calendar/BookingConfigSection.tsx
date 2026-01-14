'use client';

import React from 'react';
import { CALENDAR_WEEK_LABELS } from '../../../../hooks/settings/useCalendarBooking';
import type { BookingConfigSectionProps } from './types';

export function BookingConfigSection({
  calendarBookingLoading,
  calendarBooking,
  isEditingCalendarBooking,
  setIsEditingCalendarBooking,
  calendarDraft,
  updateCalendarDraft,
  updateWorkingHours,
  handleSaveCalendarBooking,
  isSavingCalendarBooking,
}: BookingConfigSectionProps) {
  if (calendarBookingLoading) {
    return (
      <div className="mt-6 text-sm text-gray-400">Carregando configuracoes...</div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="text-xs text-gray-400">Fuso horario</div>
          {isEditingCalendarBooking ? (
            <input
              type="text"
              value={calendarDraft.timezone}
              onChange={(e) => updateCalendarDraft({ timezone: e.target.value })}
              className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
              placeholder="America/Sao_Paulo"
            />
          ) : (
            <div className="mt-2 text-sm text-white font-mono">{calendarDraft.timezone}</div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="text-xs text-gray-400">Duracao (min)</div>
          {isEditingCalendarBooking ? (
            <input
              type="number"
              min={5}
              max={240}
              value={calendarDraft.slotDurationMinutes}
              onChange={(e) => updateCalendarDraft({ slotDurationMinutes: Number(e.target.value) })}
              className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
            />
          ) : (
            <div className="mt-2 text-sm text-white font-mono">{calendarDraft.slotDurationMinutes} min</div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="text-xs text-gray-400">Buffer (min)</div>
          {isEditingCalendarBooking ? (
            <input
              type="number"
              min={0}
              max={120}
              value={calendarDraft.slotBufferMinutes}
              onChange={(e) => updateCalendarDraft({ slotBufferMinutes: Number(e.target.value) })}
              className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
            />
          ) : (
            <div className="mt-2 text-sm text-white font-mono">{calendarDraft.slotBufferMinutes} min</div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-gray-400 mb-3">Horario de funcionamento</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {calendarDraft.workingHours.map((day) => (
            <div key={day.day} className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateWorkingHours(day.day, { enabled: e.target.checked })}
                  disabled={!isEditingCalendarBooking}
                  className="accent-emerald-500"
                />
                <span className="w-10">{CALENDAR_WEEK_LABELS[day.day] || day.day}</span>
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="time"
                  value={day.start}
                  disabled={!isEditingCalendarBooking || !day.enabled}
                  onChange={(e) => updateWorkingHours(day.day, { start: e.target.value })}
                  className="px-2 py-1 bg-zinc-900/60 border border-white/10 rounded text-xs text-white font-mono"
                />
                <span className="text-gray-500 text-xs">ate</span>
                <input
                  type="time"
                  value={day.end}
                  disabled={!isEditingCalendarBooking || !day.enabled}
                  onChange={(e) => updateWorkingHours(day.day, { end: e.target.value })}
                  className="px-2 py-1 bg-zinc-900/60 border border-white/10 rounded text-xs text-white font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Fonte: {calendarBooking?.source || 'default'}
        </div>
      </div>

      {isEditingCalendarBooking && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setIsEditingCalendarBooking(false);
            }}
            className="h-10 px-4 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveCalendarBooking}
            disabled={!!isSavingCalendarBooking}
            className="h-10 px-6 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500 transition-colors text-sm font-medium inline-flex items-center gap-2"
          >
            {isSavingCalendarBooking ? 'Salvando...' : 'Salvar regras'}
          </button>
        </div>
      )}
    </>
  );
}
