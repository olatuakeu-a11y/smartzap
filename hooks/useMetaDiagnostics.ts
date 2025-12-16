'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  metaDiagnosticsService,
  type MetaDiagnosticsAction,
  type MetaDiagnosticsCheck,
  type MetaDiagnosticsResponse,
} from '@/services/metaDiagnosticsService'

export type MetaDiagnosticsFilter = 'all' | 'actionable' | 'problems'

function isProblemStatus(s: MetaDiagnosticsCheck['status']) {
  return s === 'fail' || s === 'warn'
}

function isActionable(check: MetaDiagnosticsCheck) {
  return (check.actions || []).some((a) => a.kind === 'api' || a.kind === 'link')
}

export function useMetaDiagnosticsController() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = React.useState<MetaDiagnosticsFilter>('problems')

  const query = useQuery<MetaDiagnosticsResponse>({
    queryKey: ['metaDiagnostics'],
    queryFn: () => metaDiagnosticsService.get(),
    staleTime: 10_000,
    gcTime: 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  })

  const actionMutation = useMutation({
    mutationFn: async (action: MetaDiagnosticsAction) => metaDiagnosticsService.runAction(action),
    onSuccess: () => {
      toast.success('Ação executada! Atualizando diagnóstico…')
      queryClient.invalidateQueries({ queryKey: ['metaDiagnostics'] })
      queryClient.invalidateQueries({ queryKey: ['metaWebhookSubscription'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Falha ao executar ação')
    },
  })

  const checks = query.data?.checks || []

  const filteredChecks = React.useMemo(() => {
    if (filter === 'all') return checks
    if (filter === 'problems') return checks.filter((c) => isProblemStatus(c.status))
    if (filter === 'actionable') return checks.filter((c) => isActionable(c))
    return checks
  }, [checks, filter])

  const counts = React.useMemo(() => {
    const out = { pass: 0, warn: 0, fail: 0, info: 0 }
    for (const c of checks) out[c.status]++
    return out
  }, [checks])

  const overall: 'pass' | 'warn' | 'fail' | 'info' = React.useMemo(() => {
    if (counts.fail > 0) return 'fail'
    if (counts.warn > 0) return 'warn'
    if (counts.pass > 0) return 'pass'
    return 'info'
  }, [counts.fail, counts.warn, counts.pass])

  const runAction = React.useCallback(
    async (action: MetaDiagnosticsAction) => {
      if (action.kind !== 'api') return
      await actionMutation.mutateAsync(action)
    },
    [actionMutation]
  )

  return {
    data: query.data,
    checks,
    filteredChecks,
    counts,
    overall,

    filter,
    setFilter,

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    refetch: query.refetch,

    runAction,
    isActing: actionMutation.isPending,
  }
}
