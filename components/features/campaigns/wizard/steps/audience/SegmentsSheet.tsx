'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactStatus } from '@/types';
import { SegmentsSheetProps } from './types';

export function SegmentsSheet({
  audienceStats,
  audienceCriteria,
  customFields,
  allContacts,
  recipientSource,
  segmentTagDraft,
  setSegmentTagDraft,
  segmentDdiDraft,
  setSegmentDdiDraft,
  segmentCustomFieldKeyDraft,
  setSegmentCustomFieldKeyDraft,
  segmentCustomFieldModeDraft,
  setSegmentCustomFieldModeDraft,
  segmentCustomFieldValueDraft,
  setSegmentCustomFieldValueDraft,
  segmentOneContactDraft,
  setSegmentOneContactDraft,
  applyAudienceCriteria,
  onClose,
  onOpenRefine,
  onPickOneContact,
}: SegmentsSheetProps) {
  const isDisabled = recipientSource === 'test';

  const handleApplyTag = (tag: string) => {
    applyAudienceCriteria?.(
      {
        status: audienceCriteria?.status ?? 'ALL',
        includeTag: String(tag || '').trim(),
        createdWithinDays: audienceCriteria?.createdWithinDays ?? null,
        excludeOptOut: true,
        noTags: false,
        uf: null,
        ddi: null,
        customFieldKey: null,
        customFieldMode: null,
        customFieldValue: null,
      },
      'manual'
    );
    onClose();
  };

  const handleApplyDdi = (ddi: string) => {
    applyAudienceCriteria?.(
      {
        status: audienceCriteria?.status ?? 'ALL',
        includeTag: null,
        createdWithinDays: audienceCriteria?.createdWithinDays ?? null,
        excludeOptOut: true,
        noTags: false,
        uf: null,
        ddi: String(ddi),
        customFieldKey: null,
        customFieldMode: null,
        customFieldValue: null,
      },
      'manual'
    );
    onClose();
  };

  const handleApplyUf = (uf: string) => {
    applyAudienceCriteria?.(
      {
        status: audienceCriteria?.status ?? 'ALL',
        includeTag: null,
        createdWithinDays: audienceCriteria?.createdWithinDays ?? null,
        excludeOptOut: true,
        noTags: false,
        uf,
        ddi: null,
        customFieldKey: null,
        customFieldMode: null,
        customFieldValue: null,
      },
      'manual'
    );
    onClose();
  };

  const handleApplyCustomField = () => {
    const key = String(segmentCustomFieldKeyDraft || '').trim();
    if (!key) return;
    applyAudienceCriteria?.(
      {
        status: audienceCriteria?.status ?? 'ALL',
        includeTag: null,
        createdWithinDays: audienceCriteria?.createdWithinDays ?? null,
        excludeOptOut: true,
        noTags: false,
        uf: null,
        ddi: null,
        customFieldKey: key,
        customFieldMode: segmentCustomFieldModeDraft,
        customFieldValue:
          segmentCustomFieldModeDraft === 'equals'
            ? segmentCustomFieldValueDraft.trim()
            : null,
      },
      'manual'
    );
    onClose();
  };

  const filteredTags = (audienceStats?.tagCountsEligible ?? [])
    .filter(({ tag }) => {
      const q = (segmentTagDraft || '').trim().toLowerCase();
      if (!q) return true;
      return String(tag || '').toLowerCase().includes(q);
    })
    .slice(0, 50);

  const filteredContacts = allContacts
    .filter((c) => c.status !== ContactStatus.OPT_OUT)
    .filter((c) => {
      const q = segmentOneContactDraft.trim().toLowerCase();
      const name = String(c.name || '').toLowerCase();
      const phone = String(c.phone || '').toLowerCase();
      const email = String(c.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    })
    .slice(0, 8);

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Segmentos</p>
          <p className="text-xs text-gray-500">
            Escolhas rápidas — sem virar construtor de filtros.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Tags
            </p>
            <button
              type="button"
              className="text-xs text-gray-400 hover:text-white transition-colors"
              onClick={() => setSegmentTagDraft('')}
              disabled={isDisabled}
            >
              Limpar busca
            </button>
          </div>

          <Input
            value={segmentTagDraft}
            onChange={(e) => setSegmentTagDraft(e.target.value)}
            placeholder="Buscar tag…"
            className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500"
            disabled={isDisabled}
          />

          <div className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-zinc-950/30">
            {filteredTags.map(({ tag, count }) => (
              <button
                key={String(tag)}
                type="button"
                className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-200 hover:bg-zinc-800/60 transition-colors"
                onClick={() => handleApplyTag(String(tag))}
                disabled={isDisabled}
              >
                <span className="truncate pr-3">{String(tag)}</span>
                <span className="text-xs text-gray-400 shrink-0">{count}</span>
              </button>
            ))}

            {(audienceStats?.tagCountsEligible?.length ?? 0) === 0 && (
              <div className="px-3 py-3 text-xs text-gray-600">
                Nenhuma tag encontrada.
              </div>
            )}
          </div>
        </div>

        {/* DDI/UF/Custom Fields */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            País (DDI)
          </p>
          <p className="text-xs text-gray-500">
            Derivado do telefone (ex.: +55).
          </p>

          {(audienceStats?.ddiCountsEligible?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(audienceStats?.ddiCountsEligible ?? [])
                .slice(0, 10)
                .map(({ ddi, count }) => (
                  <button
                    key={ddi}
                    type="button"
                    onClick={() => handleApplyDdi(ddi)}
                    disabled={isDisabled}
                    className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-gray-200 text-xs hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900"
                  >
                    +{ddi} <span className="text-gray-400">({count})</span>
                  </button>
                ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">
              Sem dados suficientes para sugerir DDI</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                value={segmentDdiDraft}
                onChange={(e) => setSegmentDdiDraft(e.target.value)}
                placeholder="ex: 55"
                className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500"
                disabled={isDisabled}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={() => {
                const ddi = String(segmentDdiDraft || '')
                  .trim()
                  .replace(/^\+/, '');
                if (!ddi) return;
                handleApplyDdi(ddi);
              }}
              disabled={isDisabled}
            >
              Aplicar
            </Button>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Estado (UF - BR)
          </p>
          <p className="text-xs text-gray-500">
            Derivado do DDD.
          </p>

          {(audienceStats?.brUfCounts?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(audienceStats?.brUfCounts ?? [])
                .slice(0, 12)
                .map(({ uf, count }) => (
                  <button
                    key={uf}
                    type="button"
                    onClick={() => handleApplyUf(uf)}
                    disabled={isDisabled}
                    className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-gray-200 text-xs hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900"
                  >
                    {uf} <span className="text-gray-400">({count})</span>
                  </button>
                ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">
              Sem dados suficientes para sugerir UFs.
            </p>
          )}

          <div className="pt-3 border-t border-white/5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Campos personalizados
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Filtre por um campo do contato.
            </p>

            <div className="grid grid-cols-1 gap-2 mt-2">
              <select
                value={segmentCustomFieldKeyDraft}
                onChange={(e) => setSegmentCustomFieldKeyDraft(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                disabled={isDisabled}
              >
                <option value="">Selecione um campo…</option>
                {customFields
                  .filter((f) => f.entity_type === 'contact')
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((f) => (
                    <option key={f.id} value={f.key}>
                      {f.label}
                    </option>
                  ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    segmentCustomFieldModeDraft === 'exists'
                      ? 'default'
                      : 'outline'
                  }
                  className={
                    segmentCustomFieldModeDraft === 'exists'
                      ? 'bg-primary-600 text-white hover:bg-primary-500'
                      : 'border-white/10 bg-zinc-900 text-white hover:bg-zinc-800'
                  }
                  onClick={() => setSegmentCustomFieldModeDraft('exists')}
                  disabled={isDisabled || !segmentCustomFieldKeyDraft}
                >
                  Tem valor
                </Button>
                <Button
                  type="button"
                  variant={
                    segmentCustomFieldModeDraft === 'equals'
                      ? 'default'
                      : 'outline'
                  }
                  className={
                    segmentCustomFieldModeDraft === 'equals'
                      ? 'bg-primary-600 text-white hover:bg-primary-500'
                      : 'border-white/10 bg-zinc-900 text-white hover:bg-zinc-800'
                  }
                  onClick={() => setSegmentCustomFieldModeDraft('equals')}
                  disabled={isDisabled || !segmentCustomFieldKeyDraft}
                >
                  Igual a
                </Button>
              </div>

              {segmentCustomFieldModeDraft === 'equals' && (
                <Input
                  value={segmentCustomFieldValueDraft}
                  onChange={(e) => setSegmentCustomFieldValueDraft(e.target.value)}
                  placeholder="ex: prata"
                  className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500"
                  disabled={isDisabled || !segmentCustomFieldKeyDraft}
                />
              )}

              <Button
                type="button"
                className="bg-primary-600 text-white hover:bg-primary-500"
                disabled={
                  isDisabled ||
                  !segmentCustomFieldKeyDraft ||
                  (segmentCustomFieldModeDraft === 'equals' &&
                    !segmentCustomFieldValueDraft.trim())
                }
                onClick={handleApplyCustomField}
              >
                Aplicar
              </Button>
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Buscar 1 contato
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Atalho para seleção manual.
              </p>

              <Input
                value={segmentOneContactDraft}
                onChange={(e) => setSegmentOneContactDraft(e.target.value)}
                placeholder="Nome, telefone, email…"
                className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-500 mt-2"
                disabled={isDisabled}
              />

              {(segmentOneContactDraft || '').trim() && (
                <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-white/10 bg-zinc-950/30">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-200 hover:bg-zinc-800/60 transition-colors"
                      onClick={() => {
                        onPickOneContact(c.id, segmentOneContactDraft);
                        onClose();
                      }}
                      disabled={isDisabled}
                    >
                      <span className="truncate pr-3">{c.name || c.phone}</span>
                      <span className="text-xs text-gray-500 shrink-0 font-mono">
                        {c.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={onClose}
        >
          Fechar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={onOpenRefine}
          disabled={isDisabled}
        >
          Ajustar status/recência…
        </Button>
      </div>
    </div>
  );
}
