'use client';

import React from 'react';
import { ArrowDown, CheckCircle2, Circle, Lock } from 'lucide-react';
import { WebhookFunnelLevel } from './types';
import { getFunnelLevelColorClasses } from './utils';

interface WebhookFunnelVisualizationProps {
  funnelLevels: WebhookFunnelLevel[];
}

export function WebhookFunnelVisualization({ funnelLevels }: WebhookFunnelVisualizationProps) {
  return (
    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
          <ArrowDown size={12} />
          Fluxo de eventos (primeiro que existir, captura)
        </div>

        <div className="space-y-0">
          {funnelLevels.map((level, index) => {
            const isLast = index === funnelLevels.length - 1;
            const colors = getFunnelLevelColorClasses(level.color);
            const activeClasses = level.isActive ? colors.active : colors.inactive;
            const ringClasses = level.isActive 
              ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ' + colors.ring 
              : '';

            return (
              <div key={level.level}>
                <div className={'relative rounded-lg border p-3 transition-all ' + activeClasses + ' ' + ringClasses}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {level.isActive ? (
                        <CheckCircle2 size={16} className={level.isSmartZap ? 'text-emerald-400' : ''} />
                      ) : level.url ? (
                        <Circle size={16} className="opacity-40" />
                      ) : (
                        <Circle size={16} className="opacity-20" />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">#{level.level}</span>
                          <span className="font-medium text-sm">{level.name}</span>
                          {level.isActive && level.isSmartZap && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded">
                              ZAPFLOW
                            </span>
                          )}
                          {level.isActive && !level.isSmartZap && level.url && (
                            <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded">
                              OUTRO
                            </span>
                          )}
                          {level.isLocked && (
                            <span
                              className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-700/50 text-gray-400 text-[10px] font-medium rounded"
                              title="Configurado no Meta Dashboard"
                            >
                              <Lock size={10} />
                              FIXO
                            </span>
                          )}
                        </div>
                        {level.url ? (
                          <code className="text-[10px] opacity-60 block mt-0.5 break-all">
                            {level.url}
                          </code>
                        ) : (
                          <span className="text-[10px] opacity-40 block mt-0.5">
                            Não configurado
                          </span>
                        )}
                      </div>
                    </div>

                    {level.isActive && (
                      <div className="flex items-center gap-1 text-[10px] font-medium bg-white/10 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        ATIVO
                      </div>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className={'flex justify-center py-1 ' + colors.arrow}>
                    <ArrowDown size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
          <span>A Meta verifica de cima para baixo</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={10} />
            = Capturando eventos
          </span>
        </div>
      </div>
    </div>
  );
}
