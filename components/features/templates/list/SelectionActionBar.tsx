'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

export interface SelectionActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDeleteClick: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDeleteClick,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center justify-between animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-3">
        <span className="text-sm text-emerald-200 font-medium">
          {selectedCount} selecionado(s)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onBulkDeleteClick}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-lg font-medium hover:bg-amber-500/15 transition-colors"
        >
          <Trash2 size={16} />
          Deletar {selectedCount}
        </button>
      </div>
    </div>
  );
};
