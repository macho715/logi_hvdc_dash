import { Suspense } from 'react'
import { CargoPageClient } from './CargoPageClient'

export default function CargoPage() {
  return (
    <Suspense>
      <CargoPageClient />
    </Suspense>
  )
}
