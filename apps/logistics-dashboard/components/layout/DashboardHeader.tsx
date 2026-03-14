'use client'

import { usePathname } from 'next/navigation'
import { useOpsStore } from '@repo/shared'
import { useT } from '@/hooks/useT'
import { LangToggle } from '@/components/ui/LangToggle'

export function DashboardHeader() {
  const pathname = usePathname()
  const t = useT()
  const lastRefreshAt = useOpsStore(state => state.lastRefreshAt)

  const PAGE_TITLES: Record<string, string> = {
    '/overview': t.nav.overview,
    '/chain':    t.nav.chain,
    '/pipeline': t.nav.pipeline,
    '/sites':    t.nav.sites,
    '/cargo':    t.nav.cargo,
  }

  const title = PAGE_TITLES[pathname] ?? 'Dashboard'

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center">
        {lastRefreshAt && (
          <span className="text-xs text-gray-500">
            {t.header.updated}: {new Date(lastRefreshAt).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        )}
        <LangToggle className="ml-4" />
      </div>
    </header>
  )
}
