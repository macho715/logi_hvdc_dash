import { Suspense } from 'react'
import { SitesPageClient } from './SitesPageClient'

export default function SitesPage() {
  return (
    <Suspense>
      <SitesPageClient />
    </Suspense>
  )
}
