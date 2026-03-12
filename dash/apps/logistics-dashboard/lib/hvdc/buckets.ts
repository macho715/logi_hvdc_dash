export type HvdcBucket = 'cumulative' | 'current' | 'future';

export type BucketCounts = Record<HvdcBucket, number>;

function isBucket(v: unknown): v is HvdcBucket {
  return v === 'cumulative' || v === 'current' || v === 'future';
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function norm(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase();
}

export function deriveBucket(row: Record<string, unknown>, now = new Date()): HvdcBucket {
  // 1) Strongest: server-provided classification
  if (isBucket(row['bucket'])) return row['bucket'];

  // 2) Explicit booleans / timestamps for site arrival or delivered
  const atSite = Boolean(row['is_at_site'] ?? row['at_site']);
  const delivered = Boolean(row['is_delivered'] ?? row['delivered']);
  const siteArrivedAt = parseDate(row['site_arrival_at'] ?? row['siteArrivalAt'] ?? row['site_arrival']);
  const deliveredAt = parseDate(row['delivered_at'] ?? row['deliveredAt']);

  if (atSite || delivered || siteArrivedAt || deliveredAt) return 'cumulative';

  // 3) Status / last known location keywords
  const status = norm(row['status'] ?? row['stage'] ?? row['state']);
  const location = norm(row['final_location'] ?? row['location_code'] ?? row['location'] ?? row['current_location']);
  const lastEvent = norm(row['last_event_type'] ?? row['lastEventType'] ?? row['last_event']);

  const inCustomsOrWh =
    status.includes('customs') ||
    status.includes('clearance') ||
    status.includes('warehouse') ||
    status.includes('wh') ||
    status.includes('mosb') ||
    status.includes('yard') ||
    status.includes('storage') ||
    location.includes('customs') ||
    location.includes('wh') ||
    location.includes('warehouse') ||
    location.includes('mosb') ||
    location.includes('yard') ||
    lastEvent.includes('customs') ||
    lastEvent.includes('wh_in') ||
    lastEvent.includes('warehouse') ||
    lastEvent.includes('mosb');

  if (inCustomsOrWh) return 'current';

  // 4) Future / planned signals
  const etd = parseDate(row['etd'] ?? row['etd_at'] ?? row['planned_etd']);
  const isPlanned =
    status.includes('planned') ||
    status.includes('schedule') ||
    status.includes('booked') ||
    status.includes('pending') ||
    lastEvent.includes('port_eta') ||
    lastEvent.includes('planned');

  if (etd && etd.getTime() > now.getTime()) return 'future';
  if (isPlanned) return 'future';

  // 5) Default: treat unknown as "current" to avoid under-reporting active workload
  return 'current';
}

export function computeBucketCounts(rows: ReadonlyArray<Record<string, unknown>>): BucketCounts {
  const counts: BucketCounts = { cumulative: 0, current: 0, future: 0 };
  const now = new Date();

  for (const r of rows) {
    const b = deriveBucket(r, now);
    counts[b] += 1;
  }

  return counts;
}
