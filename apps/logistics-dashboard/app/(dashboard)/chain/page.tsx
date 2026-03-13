import { Suspense } from 'react'
import { ChainPageClient } from './ChainPageClient'

export default function ChainPage() {
  return (
    <Suspense>
      <ChainPageClient />
    </Suspense>
  )
}
