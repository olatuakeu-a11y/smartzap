'use client';

import React from 'react';
import { FileText, Check, Clock, AlertTriangle } from 'lucide-react';
import { TemplateStatus } from '../../../../types';

export interface StatusBadgeProps {
  status: TemplateStatus;
}

const styles: Record<TemplateStatus, string> = {
  DRAFT: 'bg-zinc-500/10 text-gray-400 border-white/10',
  APPROVED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  REJECTED: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
};

const icons: Record<TemplateStatus, React.ReactNode> = {
  DRAFT: <FileText size={12} className="mr-1" />,
  APPROVED: <Check size={12} className="mr-1" />,
  PENDING: <Clock size={12} className="mr-1" />,
  REJECTED: <AlertTriangle size={12} className="mr-1" />,
};

const labels: Record<TemplateStatus, string> = {
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovado',
  PENDING: 'Em Analise',
  REJECTED: 'Rejeitado',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.PENDING}`}
    >
      {icons[status]} {labels[status]}
    </span>
  );
};
