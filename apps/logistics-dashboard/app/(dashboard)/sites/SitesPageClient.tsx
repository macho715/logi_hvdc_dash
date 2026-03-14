'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AgiAlertBanner } from '@/components/sites/AgiAlertBanner'
import { PageContextBanner } from '@/components/navigation/PageContextBanner'
import { SiteCards } from '@/components/sites/SiteCards'
import { SiteDetail } from '@/components/sites/SiteDetail'
import { buildDashboardLink, getPageContextChips, parseSitesQuery } from '@/lib/navigation/contracts'
import { ui } from '@/lib/overview/ui'
import { useCasesStore } from '@/store/casesStore'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'

export function SitesPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchSummary } = useCasesStore()
  const query = parseSitesQuery(searchParams)
  const selectedSite: SiteKey | undefined = query.site
  const tab = query.tab ?? 'summary'

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const replaceQuery = (patch: { site?: SiteKey; tab?: typeof tab }) => {
    router.replace(
      buildDashboardLink({
        page: 'sites',
        params: {
          ...query,
          ...patch,
        },
      }),
      { scroll: false },
    )
  }

  return (
    <div className={`flex h-full flex-col ${ui.pageShell}`}>
      <AgiAlertBanner />
      <div className={`${ui.pageContent} pb-0`}>
        <PageContextBanner
          title="Sites Context"
          description="Overview에서 전달된 현장과 탭 상태를 URL 기준으로 유지합니다."
          chips={getPageContextChips('sites', { site: selectedSite, tab })}
        />
      </div>
      <SiteCards selectedSite={selectedSite ?? 'AGI'} onSelect={(site) => replaceQuery({ site })} />
      <SiteDetail site={selectedSite ?? 'AGI'} tab={tab} onTabChange={(nextTab) => replaceQuery({ tab: nextTab })} />
    </div>
  )
}
