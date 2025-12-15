'use client'

import { useSettingsPerformanceController } from '@/hooks/useSettingsPerformance'
import { SettingsPerformanceView } from '@/components/features/settings/SettingsPerformanceView'

export default function SettingsPerformancePage() {
  const c = useSettingsPerformanceController()

  return (
    <SettingsPerformanceView
      data={c.data}
      isLoading={c.isLoading}
      isFetching={c.isFetching}
      rangeDays={c.rangeDays}
      setRangeDays={c.setRangeDays}
      selectedConfigHash={c.selectedConfigHash}
      setSelectedConfigHash={c.setSelectedConfigHash}
      filteredRuns={c.filteredRuns}
      configs={c.configs}
      onRefresh={() => c.refetch()}
      hint={c.data?.hint}
    />
  )
}
