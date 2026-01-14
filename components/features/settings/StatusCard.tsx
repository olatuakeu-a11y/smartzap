'use client';

import React, { forwardRef } from 'react';
import { Wifi, AlertTriangle, RefreshCw, AlertCircle, Shield, Edit2 } from 'lucide-react';
import { AccountLimits } from '../../../lib/meta-limits';

export interface StatusCardProps {
  settings: {
    isConnected: boolean;
    businessAccountId?: string | null;
    displayPhoneNumber?: string | null;
    phoneNumberId?: string | null;
  };
  limitsLoading?: boolean;
  limitsError?: boolean;
  limitsErrorMessage?: string | null;
  accountLimits?: AccountLimits | null;
  onRefreshLimits?: () => void;
  onDisconnect?: () => void;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

export const StatusCard = forwardRef<HTMLDivElement, StatusCardProps>(function StatusCard(
  {
    settings,
    limitsLoading,
    limitsError,
    limitsErrorMessage,
    accountLimits,
    onRefreshLimits,
    onDisconnect,
    isEditing,
    onToggleEdit,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={`glass-panel rounded-2xl p-8 flex items-start gap-6 border transition-all duration-500 ${settings.isConnected ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]'}`}
    >
      <div className={`p-4 rounded-2xl ${settings.isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
        {settings.isConnected ? <Wifi size={32} /> : <AlertTriangle size={32} />}
      </div>
      <div className="flex-1">
        <h3 className={`text-xl font-bold ${settings.isConnected ? 'text-white' : 'text-white'}`}>
          {settings.isConnected ? 'Sistema Online' : 'Desconectado'}
        </h3>

        <div className={`text-sm mt-3 space-y-1.5 ${settings.isConnected ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
          {settings.isConnected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="opacity-70">Conta Comercial:</span>
                <span className="font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">{settings.businessAccountId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-70">Telefone Verificado:</span>
                <span className="font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {settings.displayPhoneNumber || settings.phoneNumberId}
                </span>
              </div>
            </>
          ) : (
            <p>Conexão com Meta API perdida. Por favor re-autentique suas credenciais abaixo.</p>
          )}
        </div>

        {settings.isConnected && (
          <div className="mt-5 flex flex-wrap gap-3">
            {/* Limits Status */}
            {limitsLoading ? (
              <span className="px-3 py-1.5 bg-zinc-900 rounded-lg text-xs font-medium text-gray-400 border border-white/10 flex items-center gap-1.5 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Verificando limites...
              </span>
            ) : limitsError ? (
              <button
                onClick={onRefreshLimits}
                className="h-10 px-3 bg-red-500/10 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 flex items-center gap-1.5 hover:bg-red-500/20 transition-colors focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2"
                aria-label="Tentar buscar limites da conta novamente"
              >
                <AlertCircle size={12} aria-hidden="true" />
                {limitsErrorMessage || 'Erro ao buscar limites'}
                <RefreshCw size={10} className="ml-1" aria-hidden="true" />
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-zinc-900 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <Wifi size={12} />
                Limite: {accountLimits?.maxUniqueUsersPerDay?.toLocaleString('pt-BR')} msgs/dia
              </span>
            )}

            {/* Quality Status */}
            {!limitsError && !limitsLoading && (
              <span className={`px-3 py-1.5 bg-zinc-900 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${accountLimits?.qualityScore === 'GREEN'
                ? 'text-emerald-400 border-emerald-500/20'
                : accountLimits?.qualityScore === 'YELLOW'
                  ? 'text-yellow-400 border-yellow-500/20'
                  : accountLimits?.qualityScore === 'RED'
                    ? 'text-red-400 border-red-500/20'
                    : 'text-gray-400 border-white/10'
                }`}>
                <Shield size={12} />
                Qualidade: {accountLimits?.qualityScore === 'GREEN' ? 'Alta' : accountLimits?.qualityScore === 'YELLOW' ? 'Média' : accountLimits?.qualityScore === 'RED' ? 'Baixa' : '---'}
              </span>
            )}
          </div>
        )}
      </div>

      {settings.isConnected && (
        <div className="flex flex-col gap-3 min-w-35">
          <button
            onClick={onToggleEdit}
            className={`group relative overflow-hidden rounded-xl h-10 px-4 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2
              ${isEditing
                ? 'bg-white text-black shadow-lg hover:bg-gray-100'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
              }`}
            aria-label={isEditing ? 'Cancelar edição das configurações' : 'Editar configurações'}
            aria-pressed={isEditing}
          >
            <Edit2 size={14} className={`transition-transform duration-500 ${isEditing ? 'rotate-45' : 'group-hover:scale-110'}`} aria-hidden="true" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>

          <button
            onClick={onDisconnect}
            className="text-xs font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/5 h-10 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2"
            aria-label="Desconectar conta do WhatsApp"
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
});
