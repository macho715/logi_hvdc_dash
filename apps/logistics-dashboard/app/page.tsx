"use client"

import { Suspense } from "react"
import { UnifiedLayout } from "@/components/UnifiedLayout"

function DashboardContent() {
  return <UnifiedLayout />
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
