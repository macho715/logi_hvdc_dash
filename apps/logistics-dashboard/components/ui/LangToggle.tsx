'use client'

import { useLogisticsStore } from '@/store/logisticsStore'
import { cn } from '@/lib/utils'

/**
 * ENG / KOR language toggle button.
 * Reads and writes locale from logisticsStore (persisted to localStorage).
 */
export function LangToggle({ className }: { className?: string }) {
  const locale = useLogisticsStore((s) => s.locale)
  const setLocale = useLogisticsStore((s) => s.setLocale)

  return (
    <div className={cn('flex items-center rounded-full border border-hvdc-border-soft bg-hvdc-surface-subtle p-1', className)}>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
          locale === 'en'
            ? 'bg-hvdc-brand text-white shadow-hvdc-active'
            : 'text-hvdc-text-secondary',
        )}
        aria-pressed={locale === 'en'}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => setLocale('ko')}
        className={cn(
          'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
          locale === 'ko'
            ? 'bg-hvdc-brand text-white shadow-hvdc-active'
            : 'text-hvdc-text-secondary',
        )}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
    </div>
  )
}
