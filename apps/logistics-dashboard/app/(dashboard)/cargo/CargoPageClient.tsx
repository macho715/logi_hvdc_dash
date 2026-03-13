'use client'

import { useSearchParams } from 'next/navigation'
import { CargoTabs } from '@/components/cargo/CargoTabs'
import { PageContextBanner } from '@/components/navigation/PageContextBanner'
import { getPageContextChips, parseCargoQuery } from '@/lib/navigation/contracts'

export function CargoPageClient() {
  const searchParams = useSearchParams()
  const query = parseCargoQuery(searchParams)

  return (
    <div className="flex h-full flex-col gap-4 p-4">
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
