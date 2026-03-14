'use client'

import { useLogisticsStore } from '@/store/logisticsStore'
import { TRANSLATIONS } from '@/lib/i18n/translations'
import type { Translations } from '@/lib/i18n/translations'

/**
 * Returns the current locale's translation object.
 * Usage:  const t = useT()   →   t.nav.overview
 */
export function useT(): Translations {
  const locale = useLogisticsStore((s) => s.locale)
  return TRANSLATIONS[locale]
}
