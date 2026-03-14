'use client'

import { Building2, Waves } from 'lucide-react'

import { getSiteKind } from '@/lib/logistics/normalizers'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { siteKindBadgeClass } from '@/lib/overview/ui'

export function SiteTypeTag({ site }: { site: string | null | undefined }) {
  const t = useT()
  const kind = getSiteKind(site)

  if (kind === 'land') {
    return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            siteKindBadgeClass('land')
          )}
        >
        <Building2 size={12} />
        {t.sites.typeLand}
      </span>
    )
  }

  if (kind === 'island') {
    return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            siteKindBadgeClass('island')
          )}
        >
        <Waves size={12} />
        {t.sites.typeSea}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${siteKindBadgeClass('unknown')}`}>
      {t.sites.typeUnknown}
    </span>
  )
}
