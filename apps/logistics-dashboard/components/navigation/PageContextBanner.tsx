'use client'

import { cn } from '@/lib/utils'

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
      className={cn('rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
