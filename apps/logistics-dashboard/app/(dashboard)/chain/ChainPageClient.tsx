'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FlowChain } from '@/components/chain/FlowChain'
import { PageContextBanner } from '@/components/navigation/PageContextBanner'
import { buildDashboardLink, getPageContextChips, parseChainQuery } from '@/lib/navigation/contracts'

export function ChainPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = parseChainQuery(searchParams)

  const replaceQuery = (patch: typeof query) => {
    router.replace(
      buildDashboardLink({
        page: 'chain',
        params: {
          ...query,
          ...patch,
        },
      }),
      { scroll: false },
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-4">
        <PageContextBanner
          title="Chain Context"
          description="Overview의 route/site/focus 조건을 같은 URL로 유지합니다."
          chips={getPageContextChips('chain', query)}
        />
        <FlowChain
          focus={query.focus}
          site={query.site}
          routeType={query.route_type}
          onFocusChange={(focus) => replaceQuery({ ...query, focus })}
          onSiteChange={(site) => replaceQuery({ ...query, site, focus: 'site' })}
        />
      </div>
    </div>
  )
}
