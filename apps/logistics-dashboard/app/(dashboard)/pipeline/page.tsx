import { PipelineFilterBar } from '@/components/pipeline/PipelineFilterBar'
import { FlowPipeline } from '@/components/pipeline/FlowPipeline'
import { FlowCodeDonut } from '@/components/pipeline/FlowCodeDonut'
import { VendorBar } from '@/components/pipeline/VendorBar'
import { TransportModeBar } from '@/components/pipeline/TransportModeBar'
import { CustomsStatusCard } from '@/components/pipeline/CustomsStatusCard'
import { WarehouseSqmBar } from '@/components/pipeline/WarehouseSqmBar'

export default function PipelinePage() {
  return (
    <div className="flex flex-col h-full">
      <PipelineFilterBar />
      <div className="p-4 space-y-4">
        <FlowPipeline />
        <div className="grid grid-cols-5 gap-3">
          <FlowCodeDonut />
          <VendorBar />
          <TransportModeBar />
          <CustomsStatusCard />
          <WarehouseSqmBar />
        </div>
      </div>
    </div>
  )
}
