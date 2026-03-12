'use client'

import { useEffect, useState } from 'react'
import { useCasesStore } from '@/store/casesStore'
import { AgiAlertBanner } from '@/components/sites/AgiAlertBanner'
import { SiteCards } from '@/components/sites/SiteCards'
import { SiteDetail } from '@/components/sites/SiteDetail'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'

export default function SitesPage() {
  const { fetchSummary } = useCasesStore()
  const [selectedSite, setSelectedSite] = useState<SiteKey>('AGI')

  useEffect(() => { fetchSummary() }, [fetchSummary])

  return (
    <div className="flex flex-col h-full">
      <AgiAlertBanner />
      <SiteCards selectedSite={selectedSite} onSelect={setSelectedSite} />
      <SiteDetail site={selectedSite} />
    </div>
  )
}
