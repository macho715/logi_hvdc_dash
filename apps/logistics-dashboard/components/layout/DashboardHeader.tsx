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
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#09162b]/90 px-6 py-4 backdrop-blur-md">
      <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white">{title}</h1>
      <div className="flex items-center">
        {lastRefreshAt && (
          <span className="text-[12px] font-medium text-slate-400">
            {t.header.updated}: {new Date(lastRefreshAt).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        )}
        <LangToggle className="ml-4" />
      </div>
    </header>
  )
}
