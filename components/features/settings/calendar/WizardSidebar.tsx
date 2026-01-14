'use client';

import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import type { WizardSidebarProps } from './types';

const WIZARD_STEPS = [
  { id: 0, label: 'Checklist 60s' },
  { id: 1, label: 'Credenciais' },
  { id: 2, label: 'Conectar' },
  { id: 3, label: 'Calendario' },
];

export function WizardSidebar({
  calendarWizardStep,
  calendarCredsStatus,
  calendarAuthStatus,
  handleCalendarWizardStepClick,
}: WizardSidebarProps) {
  return (
    <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 bg-zinc-950/80 p-6">
      <div className="text-xs text-gray-400">Progresso</div>
      <div className="mt-4 space-y-2">
        {WIZARD_STEPS.map((step) => {
          const isActive = calendarWizardStep === step.id;
          const isUnlocked = step.id === 0
            || step.id === 1
            || (step.id === 2 && calendarCredsStatus?.isConfigured)
            || (step.id === 3 && calendarAuthStatus?.connected);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleCalendarWizardStepClick(step.id)}
              disabled={!isUnlocked}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                isActive
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                  : isUnlocked
                    ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                    : 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>{step.id}. {step.label}</span>
              {isActive ? <Check size={14} className="text-emerald-300" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
        <div className="text-xs font-semibold text-white">Ajuda rapida</div>
        <div className="mt-2 space-y-2">
          <a
            href="https://developers.google.com/calendar/api/quickstart/js"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
          >
            <ExternalLink size={12} />
            Guia oficial
          </a>
          <a
            href="https://www.youtube.com/results?search_query=google+calendar+oauth+setup"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
          >
            <ExternalLink size={12} />
            Video rapido (2 min)
          </a>
        </div>
      </div>

      <div className="mt-4 text-[11px] text-gray-500">
        Seu progresso fica salvo automaticamente.
      </div>
    </aside>
  );
}
