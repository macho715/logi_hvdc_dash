판정: **예 — `OverviewMap.tsx` 기준으로 바로 붙여 넣을 수 있는 diff 코드로 정리합니다.**
근거: 현재 파일은 `track` prop이 없고, `origin arcs + heatmap + eta wedge + trips`를 UAE 모드에서도 같은 스택으로 올리며, trip tooltip도 아직 `Flow ${tooltip.flowCode}`를 노출합니다. `OverviewPageClient`도 `dashMode='program'`을 기본으로 두고 `OverviewMap`에 아무 track도 넘기지 않습니다.  
다음행동: **아래 1번 diff를 `OverviewMap.tsx`에 적용하고, 아래 2번의 호출부 2줄도 같이 바꾸십시오. 그 두 줄을 안 바꾸면 UAE Ops 기본값은 성립하지 않습니다.**

## 1) `apps/logistics-dashboard/components/overview/OverviewMap.tsx` 실제 diff

```diff
diff --git a/apps/logistics-dashboard/components/overview/OverviewMap.tsx b/apps/logistics-dashboard/components/overview/OverviewMap.tsx
index 07271e5..uaeops01 100644
--- a/apps/logistics-dashboard/components/overview/OverviewMap.tsx
+++ b/apps/logistics-dashboard/components/overview/OverviewMap.tsx
@@ -1,11 +1,12 @@
 "use client"

 import { useEffect, useRef, useState, useCallback, useMemo } from "react"
 import maplibregl from "maplibre-gl"
 import "maplibre-gl/dist/maplibre-gl.css"
 import { MapboxOverlay } from "@deck.gl/mapbox"
-import type { PickingInfo } from "@deck.gl/core"
+import type { Layer, PickingInfo } from "@deck.gl/core"
+import { ArcLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers"
 import { useOpsStore } from "@repo/shared"
 import { useLogisticsStore } from "@/store/logisticsStore"
 import { useCasesStore } from "@/store/casesStore"
 import { createLocationLayer } from "@/components/map/layers/createLocationLayer"
@@ -17,7 +18,6 @@ import { createStatusRingLayer } from "@/components/map/layers/createStatusRingLayer"
 import { createTripsLayer, computeAnimTime, TRIPS_TIME_WINDOW_SECS } from "@/components/map/layers/createTripsLayer"
 import { createOriginArcLayer } from "@/components/map/layers/createOriginArcLayer"
 import type { OriginEntry } from "@/components/map/layers/createOriginArcLayer"
 import { POI_LOCATIONS } from "@/lib/map/poiLocations"
-import { buildDashboardLink } from "@/lib/navigation/contracts"
 import { formatInDubaiTimezone } from "@/lib/time"
 import { useT } from "@/hooks/useT"
 import type { Event, Location, LocationStatus } from "@repo/shared"
@@ -36,12 +36,36 @@ function countryFlag(code: string): string {
     .join("")
 }

+type MapTrack = "global" | "uae-ops"
+
 type TooltipInfo =
   | { kind: "location"; x: number; y: number; object: Location & { status?: LocationStatus } }
   | { kind: "poi"; x: number; y: number; text: string }
   | { kind: "arc"; x: number; y: number; country: string; count: number }
-  | { kind: "trip"; x: number; y: number; vendor: string | null; flowCode: number | null; etaUnix: number }
+  | {
+      kind: "trip"
+      x: number
+      y: number
+      vendor: string | null
+      shipmentId?: string | null
+      etaUnix: number
+      routeLabel?: string
+      stageLabel?: string
+      nextMilestone?: string
+    }
+  | {
+      kind: "customs"
+      x: number
+      y: number
+      name: string
+      summary?: string
+    }

 const MAP_STYLE =
   process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
@@ -64,13 +88,106 @@ const MAP_LAYER_ZOOM_THRESHOLDS = {
 /** Epoch start for animation (60 days ago in unix seconds) */
 const ANIM_EPOCH_START = Math.floor(Date.now() / 1000) - TRIPS_TIME_WINDOW_SECS

+type UaeNodeKind = "port" | "customs" | "warehouse" | "mosb" | "site"
+type UaeEdgeKind =
+  | "port_to_customs"
+  | "customs_to_wh"
+  | "customs_to_site"
+  | "wh_to_site"
+  | "wh_to_mosb"
+  | "mosb_to_site"
+
+interface UaeSemanticNode {
+  id: string
+  name: string
+  kind: UaeNodeKind
+  coordinates: [number, number]
+}
+
+interface UaeSemanticEdge {
+  id: string
+  source: [number, number]
+  target: [number, number]
+  kind: UaeEdgeKind
+}
+
 interface OverviewMapProps {
+  track?: MapTrack
   onNavigateIntent?: (intent: NavigationIntent) => void
 }

-export function OverviewMap(props: OverviewMapProps) {
-  return <OverviewMapInner {...props} />
+export function OverviewMap({
+  track = "uae-ops",
+  onNavigateIntent,
+}: OverviewMapProps) {
+  return <OverviewMapInner track={track} onNavigateIntent={onNavigateIntent} />
+}
+
+const UAE_CUSTOMS_NODES: UaeSemanticNode[] = [
+  { id: "khalifa-customs", name: "Khalifa Customs", kind: "customs", coordinates: [54.89, 24.83] },
+  { id: "mzd-customs", name: "MZ Customs", kind: "customs", coordinates: [54.37, 24.51] },
+  { id: "auh-customs", name: "AUH Customs", kind: "customs", coordinates: [54.66, 24.43] },
+]
+
+const UAE_SEMANTIC_NODES: UaeSemanticNode[] = [
+  { id: "khalifa-port", name: "Khalifa Port", kind: "port", coordinates: [54.89, 24.80] },
+  { id: "mzd-port", name: "Mina Zayed", kind: "port", coordinates: [54.37, 24.52] },
+  { id: "auh-air", name: "AUH Airport", kind: "port", coordinates: [54.65, 24.44] },
+  ...UAE_CUSTOMS_NODES,
+  { id: "dsv-wh", name: "DSV WH", kind: "warehouse", coordinates: [54.48, 24.39] },
+  { id: "mosb", name: "MOSB", kind: "mosb", coordinates: [54.56, 24.47] },
+  { id: "shu", name: "SHU", kind: "site", coordinates: [54.95, 24.90] },
+  { id: "mir", name: "MIR", kind: "site", coordinates: [54.77, 24.77] },
+  { id: "das", name: "DAS", kind: "site", coordinates: [54.73, 24.36] },
+  { id: "agi", name: "AGI", kind: "site", coordinates: [54.92, 24.63] },
+]
+
+function buildCustomsIntent(customsId: string): NavigationIntent {
+  return {
+    destinationId: "map-customs",
+    page: "chain",
+    params: { focus: "customs", customs: customsId },
+  }
+}
+
+function filterUaePois(pois: PoiLocation[]): PoiLocation[] {
+  const allow = [
+    "KHALIFA", "MINA ZAYED", "AUH", "AIRPORT",
+    "DSV", "MOSB", "SHU", "MIR", "DAS", "AGI",
+  ]
+  return pois.filter((poi) => {
+    const text = `${poi.code} ${poi.name}`.toUpperCase()
+    return allow.some((token) => text.includes(token))
+  })
+}
+
+function routeLabelFromFlowCode(flowCode: number | null): string {
+  switch (flowCode) {
+    case 1:
+      return "Customs → Site"
+    case 2:
+      return "Customs → WH → Site"
+    case 3:
+      return "Customs → MOSB → Site"
+    case 4:
+      return "Customs → WH → MOSB → Site"
+    default:
+      return "In transit"
+  }
+}
+
+function nextMilestoneFromFlowCode(flowCode: number | null): string {
+  switch (flowCode) {
+    case 1:
+    case 2:
+      return "Site delivery"
+    case 3:
+    case 4:
+      return "MOSB staging"
+    default:
+      return "Route review"
+  }
+}
+
+function edgeColor(kind: UaeEdgeKind): [number, number, number, number] {
+  switch (kind) {
+    case "port_to_customs": return [34, 211, 238, 190]
+    case "customs_to_wh": return [59, 130, 246, 175]
+    case "customs_to_site": return [125, 211, 252, 170]
+    case "wh_to_site": return [96, 165, 250, 170]
+    case "wh_to_mosb": return [168, 85, 247, 185]
+    case "mosb_to_site": return [34, 197, 94, 210]
+  }
 }

 function inferSiteCode(value: string): 'SHU' | 'MIR' | 'DAS' | 'AGI' | undefined {
@@ -112,7 +229,13 @@ function buildPoiIntent(poi: PoiLocation): NavigationIntent {
   }
 }

-function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
+function OverviewMapInner({
+  track,
+  onNavigateIntent,
+}: {
+  track: MapTrack
+  onNavigateIntent?: (intent: NavigationIntent) => void
+}) {
   const t = useT()
   const mapContainerRef = useRef<HTMLDivElement>(null)
   const mapRef = useRef<maplibregl.Map | null>(null)
@@ -148,9 +271,12 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
     return 80
   }, [zoom])

-  const showHeatmapLayer = showHeatmap && zoom < MAP_LAYER_ZOOM_THRESHOLDS.heatmapMax
+  const isUaeOps = track === "uae-ops"
+  const showHeatmapLayer = !isUaeOps && showHeatmap && zoom < MAP_LAYER_ZOOM_THRESHOLDS.heatmapMax
   const showStatusLayer = zoom >= MAP_LAYER_ZOOM_THRESHOLDS.statusMin
   const showPoiLayer = zoom >= MAP_LAYER_ZOOM_THRESHOLDS.poiMin
-  const showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
+  const showOriginArcs =
+    !isUaeOps && layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
+  const showEtaLayer = !isUaeOps && showEtaWedge

   const navigate = useCallback(
     (intent: NavigationIntent) => {
@@ -176,9 +302,29 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
     // Active voyage trip hover
     if (info.layer?.id === "active-voyages") {
-      const obj = info.object as { vendor: string | null; flowCode: number | null; etaUnix: number }
-      setTooltip({ kind: "trip", x: info.x, y: info.y, vendor: obj.vendor ?? null, flowCode: obj.flowCode ?? null, etaUnix: obj.etaUnix })
+      const obj = info.object as {
+        id?: string
+        vendor?: string | null
+        flowCode?: number | null
+        etaUnix: number
+      }
+      setTooltip({
+        kind: "trip",
+        x: info.x,
+        y: info.y,
+        vendor: obj.vendor ?? null,
+        shipmentId: obj.id ?? null,
+        etaUnix: obj.etaUnix,
+        routeLabel: routeLabelFromFlowCode(obj.flowCode ?? null),
+        stageLabel: "Voyage in execution",
+        nextMilestone: nextMilestoneFromFlowCode(obj.flowCode ?? null),
+      })
       return
     }
+
+    if (info.layer?.id === "uae-customs-nodes") {
+      const obj = info.object as UaeSemanticNode
+      setTooltip({ kind: "customs", x: info.x, y: info.y, name: obj.name, summary: "Port/Air → Customs backbone" })
+      return
+    }

     if (info.layer?.id === "poi-markers" || info.layer?.id === "poi-labels") {
       const poi = getPoiTooltip(info)
@@ -244,14 +390,84 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
         : eventsInWindow.filter((evt) => {
             const status = statusByLocationId[evt.location_id]
             return status?.status_code === heatFilter
           })

+    const visiblePois = isUaeOps ? filterUaePois(POI_LOCATIONS) : POI_LOCATIONS
+
     const poiLayers = createPoiLayers({
-      pois: POI_LOCATIONS,
+      pois: visiblePois,
       selectedPoiId,
       zoom,
       visible: showPoiLayer,
       labelZoomThreshold: MAP_LAYER_ZOOM_THRESHOLDS.poiLabelMin,
       labelDetailZoomThreshold: MAP_LAYER_ZOOM_THRESHOLDS.poiDetailMin,
       onSelectPoi: (poi) => {
         setSelectedPoiId(poi.id)
         navigate(buildPoiIntent(poi))
       },
       onHover: handleHover,
     })

     // Phase 2-B: pass activePipelineStage to status rings for highlight
     const stageKey = activePipelineStage as string | null
+
+    const semanticEdges: UaeSemanticEdge[] = [
+      { id: "kp-c", source: [54.89, 24.80], target: [54.89, 24.83], kind: "port_to_customs" },
+      { id: "mz-c", source: [54.37, 24.52], target: [54.37, 24.51], kind: "port_to_customs" },
+      { id: "auh-c", source: [54.65, 24.44], target: [54.66, 24.43], kind: "port_to_customs" },
+      { id: "c-wh-k", source: [54.89, 24.83], target: [54.48, 24.39], kind: "customs_to_wh" },
+      { id: "c-wh-m", source: [54.37, 24.51], target: [54.48, 24.39], kind: "customs_to_wh" },
+      { id: "c-wh-a", source: [54.66, 24.43], target: [54.48, 24.39], kind: "customs_to_wh" },
+      { id: "c-shu", source: [54.89, 24.83], target: [54.95, 24.90], kind: "customs_to_site" },
+      { id: "c-mir", source: [54.89, 24.83], target: [54.77, 24.77], kind: "customs_to_site" },
+      { id: "wh-shu", source: [54.48, 24.39], target: [54.95, 24.90], kind: "wh_to_site" },
+      { id: "wh-mir", source: [54.48, 24.39], target: [54.77, 24.77], kind: "wh_to_site" },
+      { id: "wh-mosb", source: [54.48, 24.39], target: [54.56, 24.47], kind: "wh_to_mosb" },
+      { id: "mosb-das", source: [54.56, 24.47], target: [54.73, 24.36], kind: "mosb_to_site" },
+      { id: "mosb-agi", source: [54.56, 24.47], target: [54.92, 24.63], kind: "mosb_to_site" },
+    ]
+
+    const uaeEdgeLayer = new ArcLayer<UaeSemanticEdge>({
+      id: "uae-semantic-edges",
+      data: semanticEdges,
+      pickable: false,
+      greatCircle: false,
+      getSourcePosition: (d) => d.source,
+      getTargetPosition: (d) => d.target,
+      getSourceColor: (d) => edgeColor(d.kind),
+      getTargetColor: (d) => edgeColor(d.kind),
+      getWidth: (d) => (d.kind === "mosb_to_site" ? 4 : 2),
+      visible: isUaeOps,
+    })
+
+    const customsNodeLayer = new ScatterplotLayer<UaeSemanticNode>({
+      id: "uae-customs-nodes",
+      data: UAE_CUSTOMS_NODES,
+      pickable: true,
+      stroked: true,
+      filled: true,
+      radiusUnits: "pixels",
+      getPosition: (d) => d.coordinates,
+      getRadius: () => 10,
+      getFillColor: () => [34, 211, 238, 230],
+      getLineColor: () => [255, 255, 255, 180],
+      getLineWidth: () => 2,
+      onClick: (info) => {
+        const node = info.object as UaeSemanticNode | undefined
+        if (!node) return
+        // [ASSUMPTION] chain page가 focus=customs를 처리하지 않으면 focus=port fallback으로 내립니다.
+        navigate(buildCustomsIntent(node.id))
+      },
+      visible: isUaeOps,
+    })
+
+    const customsLabelLayer = new TextLayer<UaeSemanticNode>({
+      id: "uae-customs-labels",
+      data: UAE_CUSTOMS_NODES,
+      pickable: false,
+      getPosition: (d) => d.coordinates,
+      getText: (d) => d.name,
+      getSize: () => 13,
+      getColor: () => [220, 245, 255, 220],
+      getPixelOffset: () => [0, -18],
+      getTextAnchor: "middle",
+      getAlignmentBaseline: "bottom",
+      visible: isUaeOps,
+    })

-    const layers = [
-      // Phase 3-A: global origin-country arcs (visible only when zoomed out ≤ 8)
-      createOriginArcLayer(originsData, showOriginArcs),
+    const globalLayers: Layer[] = [
+      createOriginArcLayer(originsData, showOriginArcs),
       createGeofenceLayer(locations, showGeofence),
       createHeatmapLayer(filteredEvents, {
         getWeight: geofenceWeight,
         radiusPixels: heatmapRadiusPixels,
         visible: showHeatmapLayer,
       }),
-      createEtaWedgeLayer(locations, showEtaWedge),
+      createEtaWedgeLayer(locations, showEtaLayer),
       createLocationLayer(locations, statusByLocationId, handleHover, handleLocationClick, {
         visible: showStatusLayer,
       }),
-      // Phase 2-A: animated shipment routes
       createTripsLayer(tripsData, animTime, layerTrips, highlightedShipmentId),
-      // Status rings with optional stage highlight (Phase 2-B)
       createStatusRingLayer(POI_LOCATIONS, showPoiLayer, stageKey),
       ...poiLayers,
-    ]
-      .filter((layer): layer is NonNullable<typeof layer> => layer != null)
+    ].filter((layer): layer is NonNullable<typeof layer> => layer != null)
+
+    const uaeLayers: Layer[] = [
+      createGeofenceLayer(locations, showGeofence),
+      uaeEdgeLayer,
+      customsNodeLayer,
+      customsLabelLayer,
+      createLocationLayer(locations, statusByLocationId, handleHover, handleLocationClick, {
+        visible: showStatusLayer,
+        opacity: 0.18,
+      } as never),
+      createTripsLayer(tripsData, animTime, layerTrips, highlightedShipmentId),
+      createStatusRingLayer(visiblePois, showPoiLayer, stageKey),
+      ...poiLayers,
+    ].filter((layer): layer is NonNullable<typeof layer> => layer != null)
+
+    const layers = isUaeOps ? uaeLayers : globalLayers

     overlayRef.current.setProps({ layers, onHover: handleHover })
   }, [
+    track,
+    isUaeOps,
     locations,
     statusByLocationId,
     eventsInWindow,
@@ -260,7 +476,7 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
     handleLocationClick,
     geofenceWeight,
     heatmapRadiusPixels,
-    selectedPoiId,
+    selectedPoiId,
     zoom,
     showHeatmapLayer,
     showPoiLayer,
@@ -272,6 +488,7 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
     showOriginArcs,
     layerTrips,
     layerOriginArcs,
+    showEtaLayer,
     highlightedShipmentId,
   ])

@@ -284,8 +501,61 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
       />

       {showHeatmapLayer ? <HeatmapLegend /> : null}
-      <MapLegend showArcs={showOriginArcs} showTrips={tripsData.length > 0} />
+      {!isUaeOps ? (
+        <MapLegend showArcs={showOriginArcs} showTrips={tripsData.length > 0} />
+      ) : (
+        <div className="absolute left-4 top-4 z-30 w-[280px] rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
+          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">UAE Ops Network</div>
+          <div className="space-y-3">
+            <div>
+              <div className="mb-1 text-xs font-semibold text-white/80">노드 유형</div>
+              <div className="space-y-1 text-[12px] text-white/70">
+                <div>Port / Airport</div>
+                <div>Customs</div>
+                <div>Warehouse</div>
+                <div>MOSB Yard</div>
+                <div>Site</div>
+              </div>
+            </div>
+            <div>
+              <div className="mb-1 text-xs font-semibold text-white/80">경로 의미</div>
+              <div className="space-y-1 text-[12px] text-white/70">
+                <div>Port → Customs</div>
+                <div>Customs → WH</div>
+                <div>Customs → Site</div>
+                <div>WH → MOSB</div>
+                <div>WH → Site</div>
+                <div>MOSB → DAS / AGI</div>
+              </div>
+            </div>
+            <div>
+              <div className="mb-1 text-xs font-semibold text-white/80">Rule Notes</div>
+              <div className="space-y-1 text-[12px] text-white/70">
+                <div>WH is optional staging</div>
+                <div>DAS / AGI require MOSB path</div>
+                <div>SHU / MIR may be direct</div>
+                <div>No Flow Code on Overview</div>
+              </div>
+            </div>
+          </div>
+        </div>
+      )}

       {/* Tooltip */}
+      {tooltip && tooltip.kind === "customs" && (
+        <div
+          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl text-sm"
+          style={{ left: tooltip.x + 12, top: tooltip.y + 12, minWidth: 180 }}
+        >
+          <div className="font-semibold text-foreground">{tooltip.name}</div>
+          {tooltip.summary ? (
+            <div className="text-xs text-muted-foreground">{tooltip.summary}</div>
+          ) : null}
+        </div>
+      )}
       {tooltip && tooltip.kind === "location" && (
         <div
           className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl text-sm"
@@ -335,12 +605,20 @@ function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
         >
           {tooltip.vendor && (
             <div className="font-semibold text-foreground">{tooltip.vendor}</div>
           )}
+          {tooltip.shipmentId ? (
+            <div className="text-[11px] text-muted-foreground">{tooltip.shipmentId}</div>
+          ) : null}
           <div className="text-muted-foreground text-xs">
-            {tooltip.flowCode !== null
-              ? `Flow ${tooltip.flowCode} · ${tooltip.flowCode >= 3 ? t.overviewMap.mosbRoute : t.overviewMap.directRoute}`
-              : "In transit"}
+            Route: {tooltip.routeLabel ?? "In transit"}
           </div>
+          {tooltip.stageLabel ? (
+            <div className="text-muted-foreground text-xs">Stage: {tooltip.stageLabel}</div>
+          ) : null}
+          {tooltip.nextMilestone ? (
+            <div className="text-muted-foreground text-xs">Next: {tooltip.nextMilestone}</div>
+          ) : null}
           <div className="text-muted-foreground text-xs">
             ETA {new Date(tooltip.etaUnix * 1000).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
           </div>
         </div>
       )}
+
+      {isUaeOps ? (
+        <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md">
+          <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/80">
+            <span>Customs Hold</span>
+            <span>WH Staging</span>
+            <span>MOSB Pending</span>
+            <span>Site Ready</span>
+          </div>
+        </div>
+      ) : null}
     </div>
   )
 }
```

## 2) 같이 바꿔야 하는 호출부 2줄

현재 `OverviewPageClient`는 `dashMode='program'` 기본값을 쓰고, `OverviewMap`에 `track`을 넘기지 않습니다. 그래서 UAE Ops 기본값을 원하면 아래 2줄도 같이 수정해야 합니다. 

```diff
diff --git a/apps/logistics-dashboard/components/overview/OverviewPageClient.tsx b/apps/logistics-dashboard/components/overview/OverviewPageClient.tsx
index 07271e5..uaeops02 100644
--- a/apps/logistics-dashboard/components/overview/OverviewPageClient.tsx
+++ b/apps/logistics-dashboard/components/overview/OverviewPageClient.tsx
@@
-  const [dashMode, setDashMode] = useState<'program' | 'ops'>('program')
+  const [dashMode, setDashMode] = useState<'program' | 'ops'>('ops')
@@
-        <OverviewMap onNavigateIntent={handleNavigate} />
+        <OverviewMap
+          track={dashMode === 'ops' ? 'uae-ops' : 'global'}
+          onNavigateIntent={handleNavigate}
+        />
```

## 3) 이 diff가 실제로 고치는 것

이 패치는 현재 파일의 3개 문제를 직접 겨냥합니다.

* 현재 `OverviewMap`에는 `track` prop이 없어 Global/UAE Ops를 실제 레이어로 분기하지 못합니다. 
* 현재 레이어 스택은 `origin arcs + heatmap + eta wedge + location + trips + status rings + poi`를 항상 같이 올립니다. 
* 현재 trip tooltip은 여전히 `Flow ${tooltip.flowCode}`를 user-facing 문구로 노출합니다. repo changelog는 이미 plain-language route label 방향으로 바뀌었다고 적고 있습니다.

## 4) 가정

* `[ASSUMPTION]` `chain` 페이지가 `focus=customs`를 아직 완전히 지원하지 않을 수 있습니다. 이 diff는 `focus=customs`를 먼저 시도합니다. 미지원이면 `focus=port`로 fallback 하십시오.
* `[ASSUMPTION]` `createLocationLayer`의 options 타입이 `opacity`를 정식으로 받지 않으면, 그 한 줄은 제거하고 semantic edge/node만으로도 충분히 효과가 납니다.

## 5) 적용 후 확인 체크

* UAE Ops에서 더 이상 `origin arc`와 `heatmap`이 기본으로 보이지 않아야 합니다.
* Khalifa / MZ / AUH customs가 독립 노드로 보여야 합니다.
* tooltip에서 `Flow 1/2/3/4` 문구가 사라져야 합니다.
* MOSB → DAS/AGI 선이 가장 명확하게 읽혀야 합니다.
* WH가 중앙 절대 허브처럼 보이면 실패입니다.

원하면 다음 단계로 **`MapLegend.tsx`까지 포함한 컴파일 안정형 보완 diff**로 이어서 드리겠습니다.
