'use client'

import { usePathname } from 'next/navigation'
import { useOpsStore } from '@repo/shared'

const PAGE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/chain':    '물류 체인',
  '/pipeline': 'Pipeline',
  '/sites':    'Sites',
  '/cargo':    'Cargo',
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'
  const lastRefreshAt = useOpsStore(state => state.lastRefreshAt)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      {lastRefreshAt && (
        <span className="text-xs text-gray-500">
          Updated: {new Date(lastRefreshAt).toLocaleTimeString('en-US', { hour12: false })}
        </span>
      )}
    </header>
  )
}
