'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface LimitWarningProps {
  recipientCount: number;
  currentLimit: number;
  setStep: (step: number) => void;
}

export function LimitWarning({
  recipientCount,
  currentLimit,
  setStep,
}: LimitWarningProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="font-bold text-red-400 text-sm mb-1">
          ⛔ Não é possível disparar
        </p>
        <p className="text-sm text-red-200/70">
          Você selecionou{' '}
          <span className="font-bold text-white">{recipientCount}</span> contatos,
          mas seu limite é{' '}
          <span className="font-bold text-white">{currentLimit}</span>/dia.
        </p>
        <button
          onClick={() => setStep(2)}
          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
        >
          ← Voltar e ajustar destinatários
        </button>
      </div>
    </div>
  );
}
