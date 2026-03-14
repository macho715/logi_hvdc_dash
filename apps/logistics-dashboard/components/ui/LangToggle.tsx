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
    <div className={cn('flex items-center rounded-full border border-gray-700 bg-gray-800 p-0.5', className)}>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200',
        )}
        aria-pressed={locale === 'en'}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => setLocale('ko')}
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          locale === 'ko'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200',
        )}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
    </div>
  )
}
