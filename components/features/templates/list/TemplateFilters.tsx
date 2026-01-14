'use client';

import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { StatusFilterType } from './types';

export interface TemplateFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  statusFilter: StatusFilterType;
  setStatusFilter: (status: StatusFilterType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // Draft selection controls
  showDraftControls: boolean;
  hasDraftSelection: boolean;
  selectedDraftCount: number;
  onOpenBulkDeleteDrafts: () => void;
  onClearDraftSelection: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILIDADE', label: 'Utilidade' },
  { value: 'AUTENTICACAO', label: 'Autenticacao' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilterType; label: string }> = [
  { value: 'APPROVED', label: 'Aprovados' },
  { value: 'PENDING', label: 'Em analise' },
  { value: 'REJECTED', label: 'Rejeitados' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'ALL', label: 'Todos' },
];

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  showDraftControls,
  hasDraftSelection,
  selectedDraftCount,
  onOpenBulkDeleteDrafts,
  onClearDraftSelection,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-emerald-400 focus-visible:outline-offset-2 ${
              categoryFilter === cat.value
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-zinc-950/40 text-gray-400 hover:text-white'
            }`}
            aria-pressed={categoryFilter === cat.value}
            aria-label={`Filtrar por categoria: ${cat.label}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        className="flex gap-2 overflow-x-auto no-scrollbar"
        role="group"
        aria-label="Filtrar por status"
      >
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-emerald-400 focus-visible:outline-offset-2 ${
              statusFilter === s.value
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-zinc-950/40 text-gray-400 hover:text-white'
            }`}
            aria-pressed={statusFilter === s.value}
            aria-label={`Filtrar por status: ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/10 rounded-xl px-4 py-3 w-full md:w-72 transition-all focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/50">
          <Search size={18} className="text-gray-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar templates..."
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar templates por nome ou conteudo"
          />
        </div>

        {showDraftControls && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBulkDeleteDrafts}
              disabled={!hasDraftSelection}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-xl font-medium hover:bg-amber-500/15 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                hasDraftSelection
                  ? 'Excluir rascunhos selecionados'
                  : 'Selecione rascunhos na lista para excluir'
              }
            >
              <Trash2 size={16} />
              Excluir selecionados ({selectedDraftCount})
            </button>

            {hasDraftSelection && (
              <button
                type="button"
                onClick={onClearDraftSelection}
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                title="Limpar selecao de rascunhos"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
