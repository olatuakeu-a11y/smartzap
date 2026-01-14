'use client';

import React from 'react';
import { RefreshCw, Sparkles, Zap } from 'lucide-react';

export interface TemplateListHeaderProps {
  templateCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenAiModal: () => void;
  onOpenBulkModal: () => void;
}

export const TemplateListHeader: React.FC<TemplateListHeaderProps> = ({
  templateCount,
  isSyncing,
  onSync,
  onOpenAiModal,
  onOpenBulkModal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Templates</h1>
        <p className="text-gray-400">Gerencie seus modelos de mensagens aprovados pelo WhatsApp</p>
      </div>
      <div className="flex gap-3">
        {/* USAGE LIMIT INDICATOR */}
        <div className="flex flex-col items-end justify-center mr-4 px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Uso da Conta</span>
            <span className={`${templateCount >= 250 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {templateCount} / 250
            </span>
          </div>
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                templateCount >= 250
                  ? 'bg-amber-500'
                  : templateCount >= 200
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((templateCount / 250) * 100, 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={onOpenBulkModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-black rounded-xl font-semibold hover:bg-emerald-400 transition-colors focus-visible:outline focus-visible:outline-emerald-400 focus-visible:outline-offset-2"
          aria-label="Gerar templates de utilidade em massa"
        >
          <Zap size={18} className="text-emerald-900" aria-hidden="true" />
          Gerar UTILIDADE em Massa
        </button>
        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950/40 text-gray-200 border border-white/10 rounded-xl font-semibold hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-emerald-400 focus-visible:outline-offset-2"
          aria-label="Criar novo template usando inteligencia artificial"
        >
          <Sparkles size={18} className="text-emerald-300" aria-hidden="true" />
          Criar com IA
        </button>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2.5 bg-zinc-950/40 border border-white/10 text-gray-200 rounded-xl font-medium hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-primary-500 focus-visible:outline-offset-2 ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
          aria-label={isSyncing ? 'Sincronizando templates com WhatsApp' : 'Sincronizar templates com WhatsApp'}
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
    </div>
  );
};
