'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Template } from '../../../../types';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  template: Template | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  template,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl w-full max-w-md p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-in zoom-in duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-500/10 rounded-full">
            <Trash2 size={24} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Deletar Template</h2>
            <p className="text-sm text-gray-400">Esta acao nao pode ser desfeita</p>
          </div>
        </div>

        <div className="bg-zinc-950/40 rounded-lg p-4 mb-6 border border-white/10">
          <p className="text-gray-300 text-sm mb-2">
            Voce esta prestes a deletar o template:
          </p>
          <p className="text-white font-semibold">{template.name}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-zinc-950/40 text-gray-300 border border-white/10 rounded-lg font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-lg font-semibold hover:bg-amber-500/15 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Confirmar Exclusao
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
