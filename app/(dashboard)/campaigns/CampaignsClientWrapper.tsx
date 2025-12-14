'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignsController } from '@/hooks/useCampaigns'
import { CampaignListView } from '@/components/features/campaigns/CampaignListView'
import { Campaign } from '@/types'

export function CampaignsClientWrapper({ initialData }: { initialData: Campaign[] }) {
    const router = useRouter()
    const {
        campaigns,
        isLoading,
        filter,
        searchTerm,
        setFilter,
        setSearchTerm,
        onDelete,
        onDuplicate,
        onRefresh,
        deletingId,
        duplicatingId,
        lastDuplicatedCampaignId,
        clearLastDuplicatedCampaignId,
    } = useCampaignsController(initialData)

    const handleRowClick = (id: string) => {
        router.push(`/campaigns/${id}`)
    }

    // Após clonar, navegar automaticamente para a campanha recém-criada.
    useEffect(() => {
        if (!lastDuplicatedCampaignId) return
        router.push(`/campaigns/${lastDuplicatedCampaignId}`)
        clearLastDuplicatedCampaignId?.()
    }, [lastDuplicatedCampaignId, router, clearLastDuplicatedCampaignId])

    return (
        <CampaignListView
            campaigns={campaigns}
            isLoading={isLoading}
            filter={filter}
            searchTerm={searchTerm}
            onFilterChange={setFilter}
            onSearchChange={setSearchTerm}
            onRefresh={onRefresh}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRowClick={handleRowClick}
            deletingId={deletingId}
            duplicatingId={duplicatingId}
        />
    )
}
