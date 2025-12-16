'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  ArrowLeft,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Wand2,
} from 'lucide-react'

import { Page, PageActions, PageDescription, PageHeader, PageTitle } from '@/components/ui/page'
import { PrefetchLink } from '@/components/ui/PrefetchLink'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import type {
  MetaDiagnosticsAction,
  MetaDiagnosticsCheck,
  MetaDiagnosticsCheckStatus,
  MetaDiagnosticsResponse,
} from '@/services/metaDiagnosticsService'

function StatusBadge({ status }: { status: MetaDiagnosticsCheckStatus }) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium'
  if (status === 'pass') return <span className={`${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-200`}><CheckCircle2 size={14} /> OK</span>
  if (status === 'warn') return <span className={`${base} bg-amber-500/10 border-amber-500/20 text-amber-200`}><AlertTriangle size={14} /> Atenção</span>
  if (status === 'fail') return <span className={`${base} bg-red-500/10 border-red-500/20 text-red-200`}><XCircle size={14} /> Falha</span>
  return <span className={`${base} bg-white/5 border-white/10 text-gray-200`}><Info size={14} /> Info</span>
}

function formatJsonMaybe(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function ActionButtons(props: {
  actions: MetaDiagnosticsAction[]
  onRunAction: (a: MetaDiagnosticsAction) => void
  disabled?: boolean
}) {
  const { actions } = props
  if (!actions?.length) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((a) => {
        if (a.kind === 'link' && a.href) {
          return (
            <Link
              key={a.id}
              href={a.href}
              className="px-3 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium inline-flex items-center gap-2"
            >
              <ExternalLink size={14} />
              {a.label}
            </Link>
          )
        }

        if (a.kind === 'api') {
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => props.onRunAction(a)}
              disabled={props.disabled}
              className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-medium transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-50"
              title={a.endpoint ? `${a.method || 'POST'} ${a.endpoint}` : undefined}
            >
              <Wand2 size={14} />
              {a.label}
            </button>
          )
        }

        return null
      })}
    </div>
  )
}

export function MetaDiagnosticsView(props: {
  data?: MetaDiagnosticsResponse
  checks: MetaDiagnosticsCheck[]
  filteredChecks: MetaDiagnosticsCheck[]
  counts: { pass: number; warn: number; fail: number; info: number }
  overall: MetaDiagnosticsCheckStatus
  isLoading: boolean
  isFetching: boolean
  filter: 'all' | 'actionable' | 'problems'
  setFilter: (v: 'all' | 'actionable' | 'problems') => void
  onRefresh: () => void
  onRunAction: (a: MetaDiagnosticsAction) => void
  isActing: boolean
}) {
  const reportText = props.data?.report?.text || ''
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1800 })

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Diagnóstico Meta</PageTitle>
          <PageDescription>
            Central de verificação (Graph API + infraestrutura) com ações rápidas. Ideal pra descobrir por que “não envia” ou “não recebe delivered/read”.
          </PageDescription>
        </div>

        <PageActions>
          <PrefetchLink
            href="/settings"
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar
          </PrefetchLink>

          <button
            onClick={() => copyToClipboard(reportText)}
            disabled={!reportText}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            title={reportText ? 'Copiar relatório resumido (redigido)' : 'Relatório indisponível'}
          >
            <Copy size={16} />
            {isCopied ? 'Copiado!' : 'Copiar relatório'}
          </button>

          <button
            onClick={props.onRefresh}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2"
            title="Atualizar"
          >
            <RefreshCw size={16} className={props.isFetching ? 'animate-spin' : ''} />
            {props.isFetching ? 'Atualizando…' : 'Atualizar'}
          </button>
        </PageActions>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500">Status geral</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={props.overall} />
                <span className="text-xs text-gray-400">({props.checks.length} checks)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Falhas / Atenções</div>
              <div className="mt-2 text-sm text-white font-medium">
                <span className="text-red-200">{props.counts.fail}</span>
                <span className="text-gray-500"> / </span>
                <span className="text-amber-200">{props.counts.warn}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            <div className="bg-zinc-900/40 border border-white/10 rounded-lg p-2">
              <div className="text-gray-500">OK</div>
              <div className="mt-1 text-white font-medium">{props.counts.pass}</div>
            </div>
            <div className="bg-zinc-900/40 border border-white/10 rounded-lg p-2">
              <div className="text-gray-500">Info</div>
              <div className="mt-1 text-white font-medium">{props.counts.info}</div>
            </div>
            <div className="bg-zinc-900/40 border border-amber-500/20 rounded-lg p-2">
              <div className="text-amber-200">Atenção</div>
              <div className="mt-1 text-white font-medium">{props.counts.warn}</div>
            </div>
            <div className="bg-zinc-900/40 border border-red-500/20 rounded-lg p-2">
              <div className="text-red-200">Falha</div>
              <div className="mt-1 text-white font-medium">{props.counts.fail}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="text-xs text-gray-500">Ambiente</div>
          <div className="mt-2 text-sm text-white">
            {(props.data?.env as any)?.vercelEnv || '—'}
          </div>
          <div className="mt-3 text-xs text-gray-400 space-y-1">
            <div>
              <span className="text-gray-500">Deploy:</span>{' '}
              <span className="font-mono text-white/90">{((props.data?.env as any)?.deploymentId as string) || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Commit:</span>{' '}
              <span className="font-mono text-white/90">{((props.data?.env as any)?.gitCommitSha as string)?.slice?.(0, 7) || '—'}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="text-xs text-gray-500">Webhook (URL esperada)</div>
          <div className="mt-2 text-sm text-white font-mono break-all">
            {props.data?.webhook?.expectedUrl || '—'}
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Verify token:{' '}
            <span className="font-mono text-white/90">{props.data?.webhook?.verifyTokenPreview || '—'}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="text-xs text-gray-400">Filtro:</div>
        {([
          { k: 'problems', label: 'Problemas' },
          { k: 'actionable', label: 'Com ações' },
          { k: 'all', label: 'Tudo' },
        ] as const).map((b) => (
          <button
            key={b.k}
            type="button"
            onClick={() => props.setFilter(b.k)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              props.filter === b.k
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-zinc-900/40 text-gray-300 border-white/10 hover:bg-white/5'
            }`}
          >
            {b.label}
          </button>
        ))}

        <div className="ml-auto text-xs text-gray-500">
          {props.isLoading ? 'Carregando…' : `${props.filteredChecks.length} itens`}
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-3">
        {props.isLoading && (
          <div className="glass-panel rounded-2xl p-6 text-sm text-gray-400">
            Carregando diagnóstico…
          </div>
        )}

        {!props.isLoading && props.filteredChecks.length === 0 && (
          <div className="glass-panel rounded-2xl p-6 text-sm text-gray-400">
            Nenhum item nesse filtro.
          </div>
        )}

        {props.filteredChecks.map((c) => (
          <div key={c.id} className="glass-panel rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                </div>
                <div className="mt-2 text-sm text-gray-300">{c.message}</div>

                <ActionButtons actions={c.actions || []} onRunAction={props.onRunAction} disabled={props.isActing} />

                {c.details && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs text-gray-400 hover:text-white transition-colors">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-3 text-xs bg-zinc-950/50 border border-white/10 rounded-xl p-4 overflow-auto text-gray-200">
                      {formatJsonMaybe(c.details)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw report (optional) */}
      {reportText && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="text-xs text-gray-500">Relatório (resumo)</div>
          <pre className="mt-3 text-xs bg-zinc-950/50 border border-white/10 rounded-xl p-4 overflow-auto text-gray-200 whitespace-pre-wrap">
            {reportText}
          </pre>
        </div>
      )}
    </Page>
  )
}
