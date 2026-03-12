// Location type - represents a physical location
export interface Location {
  location_id: string
  name: string
  siteType: "SITE" | "MOSB_WH" | "PORT" | "BERTH" | "OTHER"
  lat: number
  lon: number
}

// Status codes for locations
export type StatusCode = "OK" | "WARNING" | "CRITICAL"

// Location status - real-time status of a location
export interface LocationStatus {
  location_id: string
  occupancy_rate: number // 0..1
  status_code: StatusCode
  last_updated: string // ISO string
}

// Event type - shipment events
export interface Event {
  event_id: string
  ts: string // ISO string
  shpt_no: string
  status: string
  location_id: string
  lat: number
  lon: number
  remark?: string
}

// WebSocket message types
export type WSMessage = { type: "event"; payload: Event } | { type: "location_status"; payload: LocationStatus }

// KPI data structure
export interface KPIData {
  shipments: number
  planned: number
  inTransit: number
  arrived: number
  delayed: number
  hold: number
  unknown: number
  eventsInWindow: number
}

// Store state interface
export interface LogisticsState {
  // Normalized data
  locationsById: Record<string, Location>
  statusByLocationId: Record<string, LocationStatus>
  eventsById: Record<string, Event>

  // UI state
  windowHours: number
  heatFilter: "all" | "OK" | "WARNING" | "CRITICAL"
  showGeofence: boolean
  showHeatmap: boolean
  showEtaWedge: boolean

  // Connection state
  isConnected: boolean
  isLoading: boolean

  // Actions
  setLocations: (locations: Location[]) => void
  setLocationStatuses: (statuses: LocationStatus[]) => void
  mergeEvent: (event: Event) => void
  mergeLocationStatus: (status: LocationStatus) => void
  setWindowHours: (hours: number) => void
  setHeatFilter: (filter: "all" | "OK" | "WARNING" | "CRITICAL") => void
  toggleGeofence: () => void
  toggleHeatmap: () => void
  toggleEtaWedge: () => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
}
