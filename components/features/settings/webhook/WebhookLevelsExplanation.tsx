'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

export function WebhookLevelsExplanation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 rounded-xl transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <HelpCircle size={16} className="text-gray-400" />
          Entenda os 3 níveis de webhook
        </span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-zinc-900/50 border border-white/5 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-gray-400">
            A Meta verifica os webhooks nesta ordem. O primeiro que existir, ganha:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                #1
              </div>
              <div>
                <div className="font-medium text-emerald-300">NÚMERO</div>
                <p className="text-xs text-emerald-200/60 mt-0.5">
                  Webhook específico deste número. Ignora os níveis abaixo.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  → Use quando: sistemas diferentes por número (IA, CRM, etc)
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                #2
              </div>
              <div>
                <div className="font-medium text-blue-300">WABA</div>
                <p className="text-xs text-blue-200/60 mt-0.5">
                  Webhook para TODOS os números da sua conta comercial.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  → Use quando: 1 sistema para toda a empresa
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-700/30 border border-white/10 rounded-lg">
              <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-gray-300 font-bold text-sm shrink-0">
                #3
              </div>
              <div>
                <div className="font-medium text-gray-300">APP (Padrão)</div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Webhook configurado no Meta Developer Dashboard.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  → Fallback: usado se não tiver #1 nem #2
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
