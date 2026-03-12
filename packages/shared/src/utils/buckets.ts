import type { HvdcBucket, WorklistRow } from "../types"

export type BucketCounts = Record<HvdcBucket, number>

function isBucket(v: unknown): v is HvdcBucket {
  return v === "cumulative" || v === "current" || v === "future"
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

function norm(v: unknown): string {
  return String(v ?? "").trim().toLowerCase()
}

export function deriveBucket(row: Record<string, unknown>, now = new Date()): HvdcBucket {
  if (isBucket(row["bucket"])) return row["bucket"]

  const atSite = Boolean(row["is_at_site"] ?? row["at_site"])
  const delivered = Boolean(row["is_delivered"] ?? row["delivered"])
  const siteArrivedAt = parseDate(row["site_arrival_at"] ?? row["siteArrivalAt"] ?? row["site_arrival"])
  const deliveredAt = parseDate(row["delivered_at"] ?? row["deliveredAt"])

  if (atSite || delivered || siteArrivedAt || deliveredAt) return "cumulative"

  const status = norm(row["status"] ?? row["stage"] ?? row["state"])
  const location = norm(row["final_location"] ?? row["location_code"] ?? row["location"] ?? row["current_location"])
  const lastEvent = norm(row["last_event_type"] ?? row["lastEventType"] ?? row["last_event"])

  const inCustomsOrWh =
    status.includes("customs") ||
    status.includes("clearance") ||
    status.includes("warehouse") ||
    status.includes("wh") ||
    status.includes("mosb") ||
    status.includes("yard") ||
    status.includes("storage") ||
    location.includes("customs") ||
    location.includes("wh") ||
    location.includes("warehouse") ||
    location.includes("mosb") ||
    location.includes("yard") ||
    lastEvent.includes("customs") ||
    lastEvent.includes("wh_in") ||
    lastEvent.includes("warehouse") ||
    lastEvent.includes("mosb")

  if (inCustomsOrWh) return "current"

  const etd = parseDate(row["etd"] ?? row["etd_at"] ?? row["planned_etd"])
  const isPlanned =
    status.includes("planned") ||
    status.includes("schedule") ||
    status.includes("booked") ||
    status.includes("pending") ||
    lastEvent.includes("port_eta") ||
    lastEvent.includes("planned")

  if (etd && etd.getTime() > now.getTime()) return "future"
  if (isPlanned) return "future"

  return "current"
}

export function computeBucketCounts(rows: ReadonlyArray<Record<string, unknown>>): BucketCounts {
  const counts: BucketCounts = { cumulative: 0, current: 0, future: 0 }
  const now = new Date()

  for (const r of rows) {
    const b = deriveBucket(r, now)
    counts[b] += 1
  }

  return counts
}

export function toBucketRecord(row: WorklistRow): Record<string, unknown> {
  const meta = row.meta ?? {}

  return {
    bucket: meta["bucket"],
    is_at_site: meta["is_at_site"] ?? meta["at_site"],
    delivered: meta["delivered"],
    site_arrival_at: meta["site_arrival_at"] ?? meta["siteArrivalAt"] ?? meta["delivery_date"],
    delivered_at: meta["delivered_at"] ?? meta["deliveredAt"] ?? meta["delivery_date"] ?? row.dueAt,
    status: meta["status"] ?? meta["stage"],
    final_location: row.finalLocation,
    location_code: row.currentLocation ?? row.finalLocation,
    current_location: row.currentLocation,
    last_event_type: meta["last_event_type"] ?? meta["lastEventType"],
    etd: meta["etd"] ?? meta["planned_etd"] ?? meta["etd_at"] ?? row.eta,
  }
}
