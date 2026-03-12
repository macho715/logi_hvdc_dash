"use client"

import { useMemo } from "react"
import { useLogisticsStore } from "@/store/logisticsStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LogOut, Radio } from "lucide-react"

export function HeaderBar() {
  const isLoading = useLogisticsStore((state) => state.isLoading)
  const isConnected = useLogisticsStore((state) => state.isConnected)
  const eventsById = useLogisticsStore((state) => state.eventsById)
  const windowHours = useLogisticsStore((state) => state.windowHours)

  const kpis = useMemo(() => {
    const events = Object.values(eventsById)
    const windowMs = windowHours * 60 * 60 * 1000
    const now = Date.now()
    const eventsInWindow = events.filter((evt) => now - new Date(evt.ts).getTime() <= windowMs)

    const uniqueShipments = new Set(events.map((e) => e.shpt_no))
    const statusCounts = eventsInWindow.reduce(
      (acc, evt) => {
        const status = evt.status.toUpperCase()
        if (status.includes("PLAN")) acc.planned++
        else if (status.includes("TRANSIT")) acc.inTransit++
        else if (status.includes("DELIVER") || status.includes("ARRIV")) acc.arrived++
        else if (status.includes("DELAY")) acc.delayed++
        else if (status.includes("HOLD")) acc.hold++
        else acc.unknown++
        return acc
      },
      { planned: 0, inTransit: 0, arrived: 0, delayed: 0, hold: 0, unknown: 0 },
    )

    return {
      shipments: uniqueShipments.size,
      planned: statusCounts.planned,
      inTransit: statusCounts.inTransit,
      arrived: statusCounts.arrived,
      delayed: statusCounts.delayed,
      hold: statusCounts.hold,
      unknown: statusCounts.unknown,
      eventsInWindow: eventsInWindow.length,
    }
  }, [eventsById, windowHours])

  const setWindowHours = useLogisticsStore((state) => state.setWindowHours)
  const heatFilter = useLogisticsStore((state) => state.heatFilter)
  const setHeatFilter = useLogisticsStore((state) => state.setHeatFilter)

  const showGeofence = useLogisticsStore((state) => state.showGeofence)
  const toggleGeofence = useLogisticsStore((state) => state.toggleGeofence)
  const showHeatmap = useLogisticsStore((state) => state.showHeatmap)
  const toggleHeatmap = useLogisticsStore((state) => state.toggleHeatmap)
  const showEtaWedge = useLogisticsStore((state) => state.showEtaWedge)
  const toggleEtaWedge = useLogisticsStore((state) => state.toggleEtaWedge)

  const handleLogout = () => {
    // Stub action
    console.log("Logout clicked")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        {/* Title and Connection Status */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">MOSB Logistics Dashboard</h1>
          <Badge variant="secondary" className="text-xs">
            Client-Only Mode
          </Badge>
          <div className="flex items-center gap-1.5">
            <Radio className={`h-3.5 w-3.5 ${isConnected ? "text-green-500" : "text-red-500"}`} />
            <span className={`text-xs font-medium ${isConnected ? "text-green-500" : "text-red-500"}`}>
              LIVE: {isConnected ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* KPI Badges */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </>
          ) : (
            <>
              <KPIBadge label="Shipments" value={kpis.shipments} />
              <KPIBadge label="Planned" value={kpis.planned} color="blue" />
              <KPIBadge label="In-Transit" value={kpis.inTransit} color="cyan" />
              <KPIBadge label="Arrived" value={kpis.arrived} color="green" />
              <KPIBadge label="Delayed" value={kpis.delayed} color="amber" />
              <KPIBadge label="Hold" value={kpis.hold} color="orange" />
              <KPIBadge label="Unknown" value={kpis.unknown} color="gray" />
              <KPIBadge label="Events" value={kpis.eventsInWindow} color="purple" />
            </>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Switch id="geofence" checked={showGeofence} onCheckedChange={toggleGeofence} />
            <Label htmlFor="geofence" className="text-xs whitespace-nowrap">
              Geofence
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="heatmap" checked={showHeatmap} onCheckedChange={toggleHeatmap} />
            <Label htmlFor="heatmap" className="text-xs whitespace-nowrap">
              Heatmap
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="eta-wedge" checked={showEtaWedge} onCheckedChange={toggleEtaWedge} />
            <Label htmlFor="eta-wedge" className="text-xs whitespace-nowrap">
              ETA Wedge
            </Label>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Label htmlFor="window" className="text-xs whitespace-nowrap">
              Window (h)
            </Label>
            <Input
              id="window"
              type="number"
              min={1}
              max={168}
              value={windowHours}
              onChange={(e) => setWindowHours(Math.max(1, Number.parseInt(e.target.value) || 24))}
              className="w-16 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="heat-filter" className="text-xs whitespace-nowrap">
              Heat Filter
            </Label>
            <Select value={heatFilter} onValueChange={(v) => setHeatFilter(v as typeof heatFilter)}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="OK">OK</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User info and Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            User: <span className="text-foreground font-medium">admin</span>{" "}
            <Badge variant="outline" className="text-xs ml-1">
              ADMIN
            </Badge>
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

function KPIBadge({
  label,
  value,
  color = "default",
}: {
  label: string
  value: number
  color?: "default" | "blue" | "cyan" | "green" | "amber" | "orange" | "gray" | "purple"
}) {
  const colorClasses = {
    default: "bg-secondary text-secondary-foreground",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${colorClasses[color]}`}>
      <span className="font-medium">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
