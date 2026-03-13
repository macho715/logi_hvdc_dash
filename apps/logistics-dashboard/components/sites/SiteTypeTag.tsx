'use client'

import { Building2, Waves } from 'lucide-react'

import { getSiteKind } from '@/lib/logistics/normalizers'
import { cn } from '@/lib/utils'

export function SiteTypeTag({ site }: { site: string | null | undefined }) {
  const kind = getSiteKind(site)

  if (kind === 'land') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        )}
      >
        <Building2 size={12} />
        육상
      </span>
    )
  }

  if (kind === 'island') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
          'border-sky-500/30 bg-sky-500/10 text-sky-300'
        )}
      >
        <Waves size={12} />
        해상 · MOSB
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-400">
      미지정
    </span>
  )
}
