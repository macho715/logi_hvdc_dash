'use client'

import { usePathname } from 'next/navigation'
import { useOpsStore } from '@repo/shared'
import { useT } from '@/hooks/useT'
import { LangToggle } from '@/components/ui/LangToggle'
import { ui } from '@/lib/overview/ui'

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
    <header className={`sticky top-0 z-20 flex items-center justify-between px-6 py-4 ${ui.topbar}`}>
      <h1 className="text-[20px] font-bold tracking-[-0.02em] text-hvdc-text-primary">{title}</h1>
      <div className="flex items-center">
        {lastRefreshAt && (
          <span className="text-[12px] font-medium text-hvdc-text-secondary">
            {t.header.updated}: {new Date(lastRefreshAt).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        )}
        <LangToggle className="ml-4" />
      </div>
    </header>
  )
}
