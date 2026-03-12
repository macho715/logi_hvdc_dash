'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, ArrowRightLeft, Building2, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/overview',  icon: Map,            label: 'Overview' },
  { href: '/pipeline',  icon: ArrowRightLeft,  label: 'Pipeline' },
  { href: '/sites',     icon: Building2,       label: 'Sites' },
  { href: '/cargo',     icon: Package,         label: 'Cargo' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-200',
      collapsed ? 'w-14' : 'w-48'
    )}>
      {/* Logo area */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">HVDC</span>
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
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-colors text-sm',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
