'use client'

import { cn } from '@/lib/utils'
import { ui } from '@/lib/overview/ui'

interface PageContextBannerProps {
  title: string
  description: string
  chips: string[]
  className?: string
}

export function PageContextBanner({
  title,
  description,
  chips,
  className,
}: PageContextBannerProps) {
  if (chips.length === 0) return null

  return (
    <section
      aria-label={`${title} 컨텍스트`}
      className={cn(ui.contextBanner, className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-hvdc-text-primary">{title}</h2>
          <p className="text-xs text-hvdc-text-secondary">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-hvdc-brand/30 bg-hvdc-brand/10 px-2.5 py-1 text-xs text-hvdc-brand-hi"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
