/**
 * Port coordinate lookup — POL (origin) and POD (UAE destination) mapping.
 * Used by the TripsLayer to animate in-transit shipments on the map.
 *
 * Coordinates are WGS84 [longitude, latitude] pairs (deck.gl convention).
 */

export type LonLat = [number, number]

// ── UAE destination ports (POD) ────────────────────────────────────────────

/** Maps various POD string representations → UAE port coordinates */
const UAE_POD_MAP: Record<string, LonLat> = {
  // Khalifa Port / KPCT
  "khalifa": [54.64842, 24.8095],
  "kpct":    [54.64842, 24.8095],
  "kpp":     [54.64842, 24.8095],
  "aekhl":   [54.64842, 24.8095],
  "aeabz":   [54.64842, 24.8095],

  // Mina Zayed Port (Abu Dhabi)
  "zayed":   [54.37798, 24.52489],
  "mzp":     [54.37798, 24.52489],
  "mzd":     [54.37798, 24.52489],
  "aemzd":   [54.37798, 24.52489],
  "aead":    [54.37798, 24.52489],
  "abu dhabi":[54.37798, 24.52489],

  // Jebel Ali (Dubai)
  "jebel ali": [55.0614, 25.0136],
  "jafz":      [55.0614, 25.0136],
  "jea":       [55.0614, 25.0136],
  "aejea":     [55.0614, 25.0136],
  "dubai":     [55.0614, 25.0136],

  // Abu Dhabi Airport (air freight)
  "auh":    [54.6492, 24.441],
  "aeauh":  [54.6492, 24.441],
}

// ── Global origin ports (POL) ─────────────────────────────────────────────

/** Maps various POL string representations → port coordinates */
const ORIGIN_PORT_MAP: Record<string, LonLat> = {
  // ── South Korea ──
  "busan":    [129.0403, 35.1028],
  "krpus":    [129.0403, 35.1028],
  "incheon":  [126.6358, 37.4563],
  "krinc":    [126.6358, 37.4563],
  "korea":    [129.0403, 35.1028],
  "kr":       [129.0403, 35.1028],

  // ── Japan ──
  "yokohama": [139.638, 35.4437],
  "jpyok":    [139.638, 35.4437],
  "kobe":     [135.1955, 34.6901],
  "jpukb":    [135.1955, 34.6901],
  "nagoya":   [136.8912, 35.0563],
  "jpngo":    [136.8912, 35.0563],
  "tokyo":    [139.7454, 35.6495],
  "jptyo":    [139.7454, 35.6495],
  "japan":    [139.638, 35.4437],
  "jp":       [139.638, 35.4437],

  // ── China ──
  "shanghai": [121.4737, 31.2304],
  "cnsha":    [121.4737, 31.2304],
  "tianjin":  [117.7213, 39.0059],
  "cntsn":    [117.7213, 39.0059],
  "guangzhou":[113.2329, 23.1291],
  "cngzh":    [113.2329, 23.1291],
  "ningbo":   [121.5497, 29.8683],
  "cnnbo":    [121.5497, 29.8683],
  "china":    [121.4737, 31.2304],
  "cn":       [121.4737, 31.2304],

  // ── Germany ──
  "hamburg":  [9.8689, 53.5753],
  "deham":    [9.8689, 53.5753],
  "bremen":   [8.8099, 53.0793],
  "debrv":    [8.8099, 53.0793],
  "germany":  [9.8689, 53.5753],
  "de":       [9.8689, 53.5753],

  // ── Sweden ──
  "gothenburg":[11.9746, 57.7089],
  "segot":    [11.9746, 57.7089],
  "stockholm":[18.0686, 59.3346],
  "sesto":    [18.0686, 59.3346],
  "sweden":   [11.9746, 57.7089],
  "se":       [11.9746, 57.7089],

  // ── Belgium ──
  "antwerp":  [4.4025, 51.2194],
  "beanr":    [4.4025, 51.2194],
  "belgium":  [4.4025, 51.2194],
  "be":       [4.4025, 51.2194],

  // ── United Kingdom ──
  "felixstowe":[1.3518, 51.9636],
  "gbfxt":    [1.3518, 51.9636],
  "southampton":[1.4042, 50.8975],
  "gbsou":    [1.4042, 50.8975],
  "london":   [0.5052, 51.5074],
  "gblon":    [0.5052, 51.5074],
  "uk":       [1.3518, 51.9636],
  "gb":       [1.3518, 51.9636],

  // ── France ──
  "le havre": [0.1079, 49.4938],
  "frleh":    [0.1079, 49.4938],
  "marseille":[5.3698, 43.2965],
  "frmrs":    [5.3698, 43.2965],
  "france":   [0.1079, 49.4938],
  "fr":       [0.1079, 49.4938],

  // ── Italy ──
  "genoa":    [8.9232, 44.4056],
  "itgoa":    [8.9232, 44.4056],
  "la spezia":[9.8289, 44.1024],
  "itlsp":    [9.8289, 44.1024],
  "naples":   [14.2523, 40.8518],
  "itnap":    [14.2523, 40.8518],
  "italy":    [8.9232, 44.4056],
  "it":       [8.9232, 44.4056],

  // ── Finland ──
  "helsinki": [24.9521, 60.1699],
  "fihel":    [24.9521, 60.1699],
  "finland":  [24.9521, 60.1699],
  "fi":       [24.9521, 60.1699],

  // ── Netherlands ──
  "rotterdam":[4.4777, 51.9244],
  "nlrtm":    [4.4777, 51.9244],
  "amsterdam":[4.9166, 52.3676],
  "nlams":    [4.9166, 52.3676],
  "netherlands":[4.4777, 51.9244],
  "nl":       [4.4777, 51.9244],

  // ── Spain ──
  "barcelona":[2.1734, 41.3851],
  "esbcn":    [2.1734, 41.3851],
  "valencia": [-0.3326, 39.4536],
  "esvlc":    [-0.3326, 39.4536],
  "spain":    [2.1734, 41.3851],
  "es":       [2.1734, 41.3851],

  // ── USA ──
  "new york": [-74.0059, 40.7128],
  "usnyc":    [-74.0059, 40.7128],
  "houston":  [-95.3698, 29.7604],
  "usbpt":    [-95.3698, 29.7604],
  "los angeles":[-118.2437, 34.0522],
  "uslax":    [-118.2437, 34.0522],
  "usa":      [-74.0059, 40.7128],
  "us":       [-74.0059, 40.7128],

  // ── India ──
  "mumbai":   [72.8777, 19.0760],
  "inmaa":    [72.8777, 19.0760],
  "nhava sheva":[72.9497, 18.9484],
  "innsv":    [72.9497, 18.9484],
  "india":    [72.8777, 19.0760],
  "in":       [72.8777, 19.0760],
}

/** Normalize port string for lookup */
function normalizeKey(port: string): string {
  return port.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
}

/**
 * Resolve a POD (port of discharge) string to UAE coordinates.
 * Returns null if not a known UAE port.
 */
export function resolvePodCoords(pod: string | null): LonLat | null {
  if (!pod) return null
  const key = normalizeKey(pod)

  // Exact match
  if (UAE_POD_MAP[key]) return UAE_POD_MAP[key]

  // Substring match
  for (const [k, coords] of Object.entries(UAE_POD_MAP)) {
    if (key.includes(k) || k.includes(key)) return coords
  }

  return null
}

/**
 * Resolve a POL (port of loading) string to origin coordinates.
 * Falls back to a generic mid-ocean position if unknown.
 */
export function resolvePolCoords(pol: string | null): LonLat | null {
  if (!pol) return null
  const key = normalizeKey(pol)

  // Exact match
  if (ORIGIN_PORT_MAP[key]) return ORIGIN_PORT_MAP[key]

  // Substring match (check if key is contained or contains map entry)
  for (const [k, coords] of Object.entries(ORIGIN_PORT_MAP)) {
    if (key.includes(k) || k.includes(key)) return coords
  }

  return null
}
