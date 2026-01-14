'use client';

import React from 'react';
import { humanizePrecheckReason } from '@/lib/precheck-humanizer';
import type { QuickEditFocus } from '@/hooks/campaigns/useCampaignWizardUI';
import type { PrecheckResultItem, BatchFixCandidate } from './types';

interface SkippedContactsTableProps {
  results: PrecheckResultItem[];
  totalSkipped: number;
  recipientSource: 'all' | 'specific' | 'test' | null;
  customFieldLabelByKey: Record<string, string>;
  // Batch fix controls
  setBatchFixQueue: (queue: BatchFixCandidate[]) => void;
  setBatchFixIndex: (index: number) => void;
  batchNextRef: React.MutableRefObject<BatchFixCandidate | null>;
  batchCloseReasonRef: React.MutableRefObject<'advance' | 'finish' | null>;
  setQuickEditContactId: (id: string | null) => void;
  setQuickEditFocusSafe: (focus: QuickEditFocus) => void;
}

export function SkippedContactsTable({
  results,
  totalSkipped,
  recipientSource,
  customFieldLabelByKey,
  setBatchFixQueue,
  setBatchFixIndex,
  batchNextRef,
  batchCloseReasonRef,
  setQuickEditContactId,
  setQuickEditFocusSafe,
}: SkippedContactsTableProps) {
  const skippedResults = results.filter((r) => !r.ok).slice(0, 20);

  const handleFixContact = (item: PrecheckResultItem) => {
    // If user opened manually, end any batch
    setBatchFixQueue([]);
    setBatchFixIndex(0);
    batchNextRef.current = null;
    batchCloseReasonRef.current = null;

    const h = humanizePrecheckReason(
      String(item.reason || item.skipCode || ''),
      { customFieldLabelByKey }
    );
    setQuickEditContactId(item.contactId!);
    setQuickEditFocusSafe((h.focus as QuickEditFocus) || null);
  };

  return (
    <details className="bg-zinc-950/30 border border-white/5 rounded-lg p-3">
      <summary className="cursor-pointer text-gray-300 font-medium">
        Ver ignorados (motivo + ação)
      </summary>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="py-2 pr-3">Contato</th>
              <th className="py-2 pr-3">Telefone</th>
              <th className="py-2 pr-3">Motivo</th>
              <th className="py-2 pr-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {skippedResults.map((r, idx) => {
              const h = humanizePrecheckReason(
                String(r.reason || r.skipCode || ''),
                { customFieldLabelByKey }
              );
              return (
                <tr key={r.phone + '_' + idx}>
                  <td className="py-2 pr-3 text-gray-200">{r.name}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-gray-500">
                    {r.normalizedPhone || r.phone}
                  </td>
                  <td className="py-2 pr-3">
                    <div>
                      <p className="text-amber-200/90">{h.title}</p>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    {r.contactId && recipientSource !== 'test' ? (
                      <button
                        type="button"
                        onClick={() => handleFixContact(r)}
                        className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
                      >
                        Corrigir contato
                      </button>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalSkipped > 20 && (
          <p className="mt-2 text-[10px] text-gray-500">
            Mostrando 20 de {totalSkipped} ignorados.
          </p>
        )}
      </div>
    </details>
  );
}
