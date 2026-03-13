import { Suspense } from 'react'
import { PipelinePageClient } from './PipelinePageClient'

export default function PipelinePage() {
  return (
    <Suspense>
      <PipelinePageClient />
    </Suspense>
  )
}
