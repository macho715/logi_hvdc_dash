// Timezone formatting helper for Asia/Dubai
export function formatInDubaiTimezone(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString("en-AE", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  } catch {
    return isoString
  }
}

export function isWithinWindow(isoString: string, windowHours: number): boolean {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours <= windowHours
  } catch {
    return false
  }
}
