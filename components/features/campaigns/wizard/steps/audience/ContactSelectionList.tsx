'use client';

import React from 'react';
import { Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactSelectionListProps } from './types';

export function ContactSelectionList({
  contacts,
  selectedContactIds,
  toggleContact,
  contactSearchTerm,
  setContactSearchTerm,
  totalContacts,
  recipientCount,
  isAutoSelection,
  onSwitchToManual,
}: ContactSelectionListProps) {
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 mt-6 animate-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h4 className="text-white font-bold text-sm">
            {isAutoSelection ? 'Contatos do segmento' : 'Seus Contatos'}
          </h4>
          {isAutoSelection && (
            <p className="text-xs text-gray-500 mt-1">
              Seleção automática. Para ajustar manualmente, troque para "Escolher
              contatos".
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">
            {recipientCount}/{totalContacts} selecionados
          </span>
          {isAutoSelection && onSwitchToManual && (
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={onSwitchToManual}
            >
              Editar manualmente
            </Button>
          )}
        </div>
      </div>

      {!isAutoSelection && (
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou tags..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
          {contactSearchTerm && (
            <button
              onClick={() => setContactSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-75 overflow-y-auto custom-scrollbar">
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            {!isAutoSelection && contactSearchTerm
              ? 'Nenhum contato encontrado para esta busca'
              : 'Nenhum contato encontrado'}
          </p>
        ) : (
          contacts.map((contact) => {
            const isSelected = selectedContactIds.includes(contact.id);
            return (
              <label
                key={contact.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-primary-500/10 border border-primary-500/30'
                    : 'bg-zinc-800/50 border border-transparent'
                } ${isAutoSelection ? 'cursor-default' : 'cursor-pointer hover:bg-zink-800'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isAutoSelection) return;
                    toggleContact(contact.id);
                  }}
                  disabled={isAutoSelection}
                  className="w-4 h-4 text-primary-600 bg-zinc-700 border-zinc-600 rounded focus:ring-primary-500 disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {contact.name || contact.phone}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
                </div>
                {isSelected && (
                  <Check size={16} className="text-primary-400 shrink-0" />
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
