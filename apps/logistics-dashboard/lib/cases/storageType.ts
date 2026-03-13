export type StorageBucket = 'Indoor' | 'Outdoor' | 'Outdoor Cov'

export function normalizeStorageType(raw: string | null | undefined): StorageBucket | null {
  if (!raw) return null

  const value = raw.trim().toLowerCase()

  if (value === 'indoor') return 'Indoor'
  if (value === 'outdoor' || value === 'outtdoor') return 'Outdoor'
  if (
    value === 'open yard' ||
    value === 'outdoor cov' ||
    value === 'outdoor covered' ||
    value.startsWith('outdoor cov')
  ) {
    return 'Outdoor Cov'
  }

  return null
}
