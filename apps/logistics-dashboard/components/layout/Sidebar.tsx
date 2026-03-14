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

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const t = useT()

  return (
    <aside className={cn(
      'flex flex-col bg-[#071225] border-r border-white/5 transition-all duration-200',
      collapsed ? 'w-14' : 'w-48'
    )}>
      {/* Logo area */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
        {!collapsed && (
          <span className="text-[18px] font-bold tracking-[-0.02em] text-white">HVDC</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-500 hover:text-gray-200 ml-auto"
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
                  ? 'bg-[#2563EB] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_6px_18px_rgba(37,99,235,.28)]'
                  : 'text-slate-300 font-medium hover:bg-white/5 hover:text-white'
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
