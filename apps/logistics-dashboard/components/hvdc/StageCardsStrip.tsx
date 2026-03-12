"use client"

import { useMemo } from "react"
import type { WorklistRow } from "@repo/shared"
import type { HvdcBucket } from "@/lib/hvdc/buckets"
import { computeBucketCounts, toBucketRecord } from "@/lib/hvdc/buckets"

export type StageCardsStripProps = {
  rows: ReadonlyArray<WorklistRow>
  onNavigateBucket: (bucket: HvdcBucket) => void
  className?: string
  activeBucket?: HvdcBucket
  disabled?: boolean
}

type StageCardSpec = {
  bucket: HvdcBucket
  title: string
  subtitle: string
}

const CARD_SPECS: StageCardSpec[] = [
  {
    bucket: "cumulative",
    title: "누적",
    subtitle: "현장 입고 (cumulative)",
  },
  {
    bucket: "current",
    title: "현재",
    subtitle: "통관/창고 (in progress)",
  },
  {
    bucket: "future",
    title: "미래",
    subtitle: "선적 예정 (planned)",
  },
]

export function StageCardsStrip({
  rows,
  onNavigateBucket,
  className,
  activeBucket,
  disabled = false,
}: StageCardsStripProps) {
  const bucketRows = useMemo(() => rows.map(toBucketRecord), [rows])
  const counts = useMemo(() => computeBucketCounts(bucketRows), [bucketRows])

  return (
    <div className={className ?? ""}>
      <div className="grid grid-cols-3 gap-2">
        {CARD_SPECS.map((spec) => {
          const value = counts[spec.bucket]
          const isActive = activeBucket === spec.bucket
          return (
            <button
              key={spec.bucket}
              type="button"
              onClick={() => onNavigateBucket(spec.bucket)}
              disabled={disabled}
              aria-pressed={isActive}
              title={spec.subtitle}
              className={[
                "rounded-lg border border-border bg-card/80 px-3 py-2 text-left shadow-sm outline-none",
                "min-h-[72px]",
                "transition-colors transition-shadow duration-150",
                "hover:bg-accent/40",
                "focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "ring-2 ring-ring" : "",
                disabled ? "opacity-50 pointer-events-none" : "",
              ].join(" ")}
              aria-label={`${spec.title} 카드 열기: ${spec.subtitle}`}
            >
              <div className="text-xs text-muted-foreground truncate">{spec.subtitle}</div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <div className="text-sm font-semibold text-foreground">{spec.title}</div>
                <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
