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
    <div
      className={cn('flex items-center rounded-full border border-white/6 p-1', className)}
      style={{ background: 'linear-gradient(180deg, rgba(12,18,34,.96), rgba(8,13,26,.98))' }}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
          locale === 'en'
            ? 'text-white shadow-hvdc-glow-blue'
            : 'text-hvdc-text-muted',
        )}
        style={locale === 'en' ? { background: 'linear-gradient(180deg, rgba(47,118,255,.92), rgba(56,125,255,.8))' } : undefined}
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
            ? 'text-white shadow-hvdc-glow-blue'
            : 'text-hvdc-text-muted',
        )}
        style={locale === 'ko' ? { background: 'linear-gradient(180deg, rgba(47,118,255,.92), rgba(56,125,255,.8))' } : undefined}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
    </div>
  )
}
