'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';

export interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedNames: Set<string>;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  selectedNames,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const namesList = Array.from(selectedNames);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl w-full max-w-md p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Trash2 className="text-amber-300" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deletar Templates</h3>
            <p className="text-sm text-gray-400">Esta acao nao pode ser desfeita</p>
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 mb-3">
            Voce esta prestes a deletar{' '}
            <strong className="text-amber-300">{selectedNames.size} template(s)</strong> da Meta:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {namesList.map((name) => (
              <div
                key={name}
                className="text-xs text-gray-400 font-mono bg-zinc-950/40 px-2 py-1 rounded border border-white/10"
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-gray-300 bg-zinc-950/40 border border-white/10 hover:bg-white/5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-lg font-medium hover:bg-amber-500/15 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deletando...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Deletar {selectedNames.size}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
