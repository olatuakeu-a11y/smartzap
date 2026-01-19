'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Check, Loader2, Trash2, Eye, Pencil, Send, Megaphone } from 'lucide-react';
import { Template } from '../../../../types';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';

export interface TemplateTableRowProps {
  template: Template;
  isManualDraft: boolean;
  isRowSelected: boolean;
  isSubmitting: boolean;
  isDeletingDraft: boolean;
  canSend: boolean;
  sendReason?: string;
  // Selection handlers
  onToggleSelection: () => void;
  // Actions
  onViewDetails: () => void;
  onDeleteClick: () => void;
  onSubmitDraft: () => void;
  onDeleteDraft: () => void;
  onCreateCampaign?: () => void;
  // Hover handlers
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPrefetchPreview?: () => void;
}

const TemplateTableRowComponent: React.FC<TemplateTableRowProps> = ({
  template,
  isManualDraft,
  isRowSelected,
  isSubmitting,
  isDeletingDraft,
  canSend,
  sendReason,
  onToggleSelection,
  onViewDetails,
  onDeleteClick,
  onSubmitDraft,
  onDeleteDraft,
  onCreateCampaign,
  onMouseEnter,
  onMouseLeave,
  onPrefetchPreview,
}) => {
  const draftHref = `/templates/drafts/${encodeURIComponent(template.id)}`;

  const handleRowEnter = () => {
    onMouseEnter();
    if (!isManualDraft && onPrefetchPreview) {
      onPrefetchPreview();
    }
  };

  const handleCellClick = () => {
    if (!isManualDraft) {
      onViewDetails();
    }
  };

  return (
    <tr
      onMouseEnter={handleRowEnter}
      onMouseLeave={onMouseLeave}
      className={`hover:bg-white/5 transition-colors group cursor-pointer ${
        isRowSelected ? (isManualDraft ? 'bg-amber-500/5' : 'bg-emerald-500/5') : ''
      }`}
    >
      {/* Checkbox */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleSelection}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
            isRowSelected
              ? isManualDraft
                ? 'bg-amber-500 border-amber-500'
                : 'bg-emerald-500 border-emerald-500'
              : 'border-white/20 hover:border-white/40'
          }`}
          title={isRowSelected ? 'Desmarcar' : 'Selecionar'}
        >
          {isRowSelected && (
            <Check className={`w-3 h-3 ${isManualDraft ? 'text-black' : 'text-white'}`} />
          )}
        </button>
      </td>

      {/* Name */}
      <td className="px-4 py-4" onClick={handleCellClick}>
        {isManualDraft ? (
          <Link
            href={draftHref}
            className="flex items-center gap-3 hover:opacity-90"
            title="Continuar edicao"
          >
            <div className="p-2 bg-zinc-950/40 rounded-lg text-gray-400 group-hover:text-emerald-200 transition-colors">
              <FileText size={16} />
            </div>
            <span
              className="font-medium text-white group-hover:text-emerald-200 transition-colors truncate max-w-50"
              title={template.name}
            >
              {template.name}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-950/40 rounded-lg text-gray-400 group-hover:text-emerald-200 transition-colors">
              <FileText size={16} />
            </div>
            <span
              className="font-medium text-white group-hover:text-emerald-200 transition-colors truncate max-w-50"
              title={template.name}
            >
              {template.name}
            </span>
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-4" onClick={handleCellClick}>
        {isManualDraft ? (
          <Link href={draftHref} className="inline-block" title="Continuar edicao">
            <StatusBadge status={template.status} />
          </Link>
        ) : (
          <StatusBadge status={template.status} />
        )}
      </td>

      {/* Category */}
      <td className="px-4 py-4" onClick={handleCellClick}>
        <span
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
            template.category === 'UTILIDADE'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : template.category === 'MARKETING'
                ? 'bg-amber-500/10 text-amber-200 border-amber-500/20'
                : 'bg-white/5 text-gray-300 border-white/10'
          }`}
        >
          {template.category}
        </span>
      </td>

      {/* Language */}
      <td className="px-4 py-4 text-gray-500 font-mono text-xs" onClick={handleCellClick}>
        {isManualDraft ? (
          <Link href={draftHref} className="hover:text-gray-300" title="Continuar edicao">
            {template.language}
          </Link>
        ) : (
          template.language
        )}
      </td>

      {/* Content */}
      <td className="px-4 py-4 max-w-xs" onClick={handleCellClick}>
        {isManualDraft ? (
          <Link href={draftHref} className="block" title="Continuar edicao">
            <p className="text-sm text-gray-400 truncate" title={template.content}>
              {template.content.slice(0, 50)}
              {template.content.length > 50 ? '...' : ''}
            </p>
          </Link>
        ) : (
          <p className="text-sm text-gray-400 truncate" title={template.content}>
            {template.content.slice(0, 50)}
            {template.content.length > 50 ? '...' : ''}
          </p>
        )}
      </td>

      {/* Updated */}
      <td
        className="px-4 py-4 text-gray-500 font-mono text-xs whitespace-nowrap"
        onClick={handleCellClick}
      >
        {isManualDraft ? (
          <Link href={draftHref} className="hover:text-gray-300" title="Continuar edicao">
            {new Date(template.lastUpdated).toLocaleDateString('pt-BR')}
          </Link>
        ) : (
          new Date(template.lastUpdated).toLocaleDateString('pt-BR')
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {isManualDraft ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={draftHref} title="Continuar edicao">
                  <Pencil size={14} />
                  Continuar
                </Link>
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={onSubmitDraft}
                disabled={!canSend || isSubmitting || isDeletingDraft}
                title={!canSend ? sendReason || 'Corrija o template antes de enviar' : 'Enviar pra Meta'}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Enviar pra Meta
              </Button>
              <Button
                variant="ghost-destructive"
                size="icon-sm"
                onClick={onDeleteDraft}
                disabled={isSubmitting || isDeletingDraft}
                title="Excluir rascunho"
              >
                {isDeletingDraft ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onViewDetails}
                title="Ver detalhes"
              >
                <Eye size={16} />
              </Button>
              {template.status === 'APPROVED' && onCreateCampaign && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCreateCampaign}
                  title="Criar campanha com este template"
                >
                  <Megaphone size={16} />
                </Button>
              )}
              <Button
                variant="ghost-destructive"
                size="icon-sm"
                onClick={onDeleteClick}
                title="Deletar template"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Memoização com comparação customizada para evitar re-renders desnecessários
// Compara apenas props que afetam o visual, ignora funções (mudam a cada render do parent)
export const TemplateTableRow = React.memo(TemplateTableRowComponent, (prev, next) => {
  // Se qualquer prop visual mudou, deve re-renderizar (retorna false)
  if (prev.template.id !== next.template.id) return false;
  if (prev.template.name !== next.template.name) return false;
  if (prev.template.status !== next.template.status) return false;
  if (prev.template.category !== next.template.category) return false;
  if (prev.template.language !== next.template.language) return false;
  if (prev.template.content !== next.template.content) return false;
  if (prev.template.lastUpdated !== next.template.lastUpdated) return false;
  if (prev.isManualDraft !== next.isManualDraft) return false;
  if (prev.isRowSelected !== next.isRowSelected) return false;
  if (prev.isSubmitting !== next.isSubmitting) return false;
  if (prev.isDeletingDraft !== next.isDeletingDraft) return false;
  if (prev.canSend !== next.canSend) return false;
  if (prev.sendReason !== next.sendReason) return false;

  // Se chegou aqui, nada visual mudou - pode pular o re-render
  return true;
});
