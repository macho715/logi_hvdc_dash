import type { PipelineStage } from "@/lib/cases/pipelineStage"

export interface OriginSummaryRow {
  country: string
  count: number
}

export interface PortSummaryRow {
  name: string
  count: number
}

export interface ChainSummary {
  origins: OriginSummaryRow[]
  ports: PortSummaryRow[]
  stages: Record<PipelineStage, number>
  sites: {
    land: { SHU: number; MIR: number }
    island: { DAS: number; AGI: number }
  }
  mosbTransit: number
}
