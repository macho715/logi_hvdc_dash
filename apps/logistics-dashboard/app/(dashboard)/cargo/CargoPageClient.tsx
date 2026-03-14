'use client'

import { useSearchParams } from 'next/navigation'
import { CargoTabs } from '@/components/cargo/CargoTabs'
import { PageContextBanner } from '@/components/navigation/PageContextBanner'
import { getPageContextChips, parseCargoQuery } from '@/lib/navigation/contracts'
import { ui } from '@/lib/overview/ui'

export function CargoPageClient() {
  const searchParams = useSearchParams()
  const query = parseCargoQuery(searchParams)

  return (
    <div className={`flex h-full flex-col gap-4 ${ui.pageShell} ${ui.pageContent}`}>
      <PageContextBanner
        title="Cargo Context"
        description="Overview에서 전달된 Cargo 필터와 case selection을 URL로 복원합니다."
        chips={getPageContextChips('cargo', query)}
      />
      <div className="min-h-0 flex-1">
        <CargoTabs />
      </div>
    </div>
  )
}
