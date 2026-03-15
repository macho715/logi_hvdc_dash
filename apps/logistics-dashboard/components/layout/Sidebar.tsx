'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, ArrowRightLeft, Building2, Package, Network, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { Translations } from '@/lib/i18n/translations'

const NAV_ITEMS: { href: string; icon: React.ElementType; labelKey: keyof Translations['nav'] }[] = [
  { href: '/overview',  icon: Map,           labelKey: 'overview' },
  { href: '/chain',     icon: Network,       labelKey: 'chain' },
  { href: '/pipeline',  icon: ArrowRightLeft, labelKey: 'pipeline' },
  { href: '/sites',     icon: Building2,     labelKey: 'sites' },
  { href: '/cargo',     icon: Package,       labelKey: 'cargo' },
]

export function Sidebar({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const t = useT()

  return (
    <aside
      className={cn(
        'relative flex flex-col transition-all duration-200 text-hvdc-text-primary',
        collapsed ? 'w-14' : 'w-48',
      )}
      style={{ background: 'linear-gradient(180deg, rgba(9,15,30,.95), rgba(5,10,24,.98))' }}
    >
      {/* Right gradient line (spec-color.md §4) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,rgba(59,86,165,.14),rgba(59,86,165,0))]" />
      {/* Logo area */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-hvdc-border-soft">
        {!collapsed && (
          <span className="text-[18px] font-bold tracking-[-0.02em] text-hvdc-text-primary">HVDC</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-hvdc-text-muted hover:text-hvdc-text-primary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 mx-1 text-[15px] transition-colors duration-150',
                active
                  ? 'bg-hvdc-brand text-white font-semibold shadow-hvdc-active'
                  : 'text-hvdc-text-secondary font-medium hover:bg-hvdc-surface-hover hover:text-hvdc-text-primary'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{t.nav[labelKey]}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
