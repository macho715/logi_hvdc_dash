"use client"

import { useEffect, useMemo, useState } from "react"
import { useOpsStore } from "@repo/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatInDubaiTimezone } from "@/lib/time"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"

export function RightPanel() {
  const isLoading = useOpsStore((state) => state.isLoading)
  const locationsById = useOpsStore((state) => state.locationsById)
  const statusByLocationId = useOpsStore((state) => state.locationStatusesById)
  const [activeTab, setActiveTab] = useState<"status" | "occupancy" | "distribution">("status")

  const locations = useMemo(
    () =>
      Object.values(locationsById).filter(
        (loc) => loc.location_id.toLowerCase() !== "loc-mosb-sct-office",
      ),
    [locationsById],
  )

  const statusCounts = useMemo(() => {
    const statuses = Object.values(statusByLocationId)
    return statuses.reduce(
      (acc, s) => {
        acc[s.status_code]++
        return acc
      },
      { OK: 0, WARNING: 0, CRITICAL: 0 } as Record<string, number>,
    )
  }, [statusByLocationId])

  const occupancyData = useMemo(
    () =>
      locations.map((loc) => ({
        name: loc.name.replace("SITE ", "S").replace("MOSB ", "M").substring(0, 8),
        fullName: loc.name,
        occupancy: Math.round((statusByLocationId[loc.location_id]?.occupancy_rate ?? 0) * 100),
        status: statusByLocationId[loc.location_id]?.status_code ?? "OK",
      })),
    [locations, statusByLocationId],
  )

  const statusData = useMemo(
    () =>
      [
        { name: "OK", value: statusCounts.OK ?? 0, color: "#22c55e" },
        { name: "WARNING", value: statusCounts.WARNING ?? 0, color: "#fbbf24" },
        { name: "CRITICAL", value: statusCounts.CRITICAL ?? 0, color: "#ef4444" },
      ].filter((d) => d.value > 0),
    [statusCounts],
  )

  useEffect(() => {
    const activePanel = document.getElementById(`right-panel-panel-${activeTab}`)
    activePanel?.focus()
  }, [activeTab])

  return (
    <div className="w-80 h-full bg-card/95 backdrop-blur-sm border-l border-border overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div
            className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-1"
            role="tablist"
            aria-label="Right panel sections"
          >
            {[
              { id: "status", label: "Status" },
              { id: "occupancy", label: "Occupancy" },
              { id: "distribution", label: "Distribution" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`right-panel-tab-${tab.id}`}
                aria-controls={`right-panel-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-md px-2 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div>
            <div
              tabIndex={-1}
              role="tabpanel"
              aria-labelledby="right-panel-tab-status"
              id="right-panel-panel-status"
              hidden={activeTab !== "status"}
            >
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold">Location Status</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {locations.map((loc) => {
                        const status = statusByLocationId[loc.location_id]
                        return (
                          <div
                            key={loc.location_id}
                            className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{loc.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {status?.last_updated ? formatInDubaiTimezone(status.last_updated) : "N/A"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-mono text-foreground">
                                {status ? `${Math.round(status.occupancy_rate * 100)}%` : "-"}
                              </span>
                              <StatusBadge status={status?.status_code ?? "OK"} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div
              tabIndex={-1}
              role="tabpanel"
              aria-labelledby="right-panel-tab-occupancy"
              id="right-panel-panel-occupancy"
              hidden={activeTab !== "occupancy"}
            >
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold">Occupancy by Location</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  {isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={occupancyData} layout="vertical" margin={{ left: 0, right: 10 }}>
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#888" />
                        <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 11 }} stroke="#888" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-popover border border-border rounded-md p-2 shadow-md text-sm">
                                  <div className="font-medium">{data.fullName}</div>
                                  <div>Occupancy: {data.occupancy}%</div>
                                  <div>Status: {data.status}</div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
                          {occupancyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.status === "OK"
                                  ? "#22c55e"
                                  : entry.status === "WARNING"
                                    ? "#fbbf24"
                                    : "#ef4444"
                              }
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div
              tabIndex={-1}
              role="tabpanel"
              aria-labelledby="right-panel-tab-distribution"
              id="right-panel-panel-distribution"
              hidden={activeTab !== "distribution"}
            >
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  {isLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine={false}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload?.[0]) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-popover border border-border rounded-md p-2 shadow-md text-sm">
                                    <div className="font-medium">{data.name}</div>
                                    <div>Count: {data.value}</div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "OK" | "WARNING" | "CRITICAL" }) {
  const variants = {
    OK: "bg-green-500/20 text-green-400 border-green-500/30",
    WARNING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return (
    <Badge variant="outline" className={`text-xs px-2 py-0 ${variants[status]}`}>
      {status}
    </Badge>
  )
}
