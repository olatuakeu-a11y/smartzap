'use client';

import React from 'react';
import type { TestContact } from '@/types';

interface CampaignDetailsProps {
  name: string;
  selectedTemplateId: string;
  recipientSource: 'all' | 'specific' | 'test' | null;
  recipientCount: number;
  testContact?: TestContact;
  setStep: (step: number) => void;
}

export function CampaignDetails({
  name,
  selectedTemplateId,
  recipientSource,
  recipientCount,
  testContact,
  setStep,
}: CampaignDetailsProps) {
  const getAudienceLabel = () => {
    if (recipientSource === 'test') {
      return `🧪 Contato de Teste (${testContact?.name})`;
    }
    if (recipientSource === 'all') {
      return 'Todos os Contatos';
    }
    return 'Contatos Selecionados';
  };

  return (
    <div className="border-t border-white/5 pt-6 space-y-4">
      <h3 className="text-sm font-bold text-white mb-4">Detalhes da Campanha</h3>

      <div className="flex items-center justify-between group">
        <span className="text-sm text-gray-500">Nome da Campanha</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{name}</span>
          <button
            onClick={() => setStep(1)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"
          >
            <small>Editar</small>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between group">
        <span className="text-sm text-gray-500">Template</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white font-mono bg-zinc-900 px-2 py-1 rounded">
            {selectedTemplateId}
          </span>
          <button
            onClick={() => setStep(1)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"
          >
            <small>Editar</small>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between group">
        <span className="text-sm text-gray-500">Público</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">
            {getAudienceLabel()} ({recipientCount})
          </span>
          <button
            onClick={() => setStep(2)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"
          >
            <small>Editar</small>
          </button>
        </div>
      </div>
    </div>
  );
}
