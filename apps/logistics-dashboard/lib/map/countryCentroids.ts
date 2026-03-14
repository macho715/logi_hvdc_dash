/**
 * Country centroid coordinates for origin-arc visualization.
 * Values are WGS84 [longitude, latitude] in deck.gl convention.
 *
 * Using representative port/industrial-center positions rather than
 * geographic centroids, so arcs visually originate from where
 * HVDC equipment is actually manufactured or loaded.
 */

type LonLat = [number, number]

const CENTROIDS: Record<string, LonLat> = {
  // ── East Asia ──────────────────────────────────────────────
  KR: [127.0,  36.5],   // South Korea — Seoul / central industrial belt
  JP: [137.0,  36.5],   // Japan — Nagoya / central Japan
  CN: [118.0,  32.0],   // China — Yangtze delta (Shanghai/Jiangsu)
  TW: [120.9,  23.7],   // Taiwan

  // ── South / Southeast Asia ─────────────────────────────────
  IN: [ 78.9,  20.6],   // India — central (Pune/Mumbai region)
  MY: [109.7,   4.2],   // Malaysia — east coast industrial
  SG: [103.8,   1.35],  // Singapore
  TH: [101.0,  13.7],   // Thailand

  // ── Europe — North ─────────────────────────────────────────
  SE: [ 15.0,  59.5],   // Sweden — Stockholm / Ludvika (ABB HVDC)
  FI: [ 25.0,  61.5],   // Finland — Tampere / Helsinki
  NO: [ 10.7,  59.9],   // Norway — Oslo
  DK: [  9.5,  56.0],   // Denmark — Aarhus / Copenhagen

  // ── Europe — West ──────────────────────────────────────────
  GB: [ -1.5,  52.4],   // UK — Midlands / industrial corridor
  NL: [  5.3,  52.1],   // Netherlands — Rotterdam hinterland
  BE: [  4.5,  50.8],   // Belgium — Antwerp / Bruges
  FR: [  2.3,  47.0],   // France — Loire Valley / Paris basin
  DE: [ 10.0,  51.5],   // Germany — Nuremberg / central Germany
  AT: [ 14.5,  47.5],   // Austria — Vienna / Graz

  // ── Europe — South ─────────────────────────────────────────
  IT: [ 11.5,  44.5],   // Italy — Po Valley (Milan / Bologna)
  ES: [ -3.7,  40.4],   // Spain — Madrid region
  PT: [ -8.5,  39.6],   // Portugal — Lisbon
  CH: [  8.2,  47.4],   // Switzerland — Zurich / Baden (ABB HQ)
  CZ: [ 15.5,  50.0],   // Czech Republic — Prague
  PL: [ 19.1,  52.0],   // Poland — Warsaw

  // ── Middle East / Africa ───────────────────────────────────
  TR: [ 32.8,  39.9],   // Turkey — Ankara / Istanbul corridor
  AE: [ 54.4,  24.5],   // UAE — local supply (Abu Dhabi)
  SA: [ 46.7,  24.7],   // Saudi Arabia
  ZA: [ 28.0, -26.2],   // South Africa — Johannesburg

  // ── Americas ───────────────────────────────────────────────
  US: [-88.0,  41.8],   // USA — Great Lakes / Chicago (power equipment)
  CA: [-79.4,  43.7],   // Canada — Toronto / Ontario
  BR: [-47.0, -23.5],   // Brazil — São Paulo
  CO: [-74.3,   4.6],   // Colombia — Bogotá
  MX: [-99.1,  19.4],   // Mexico — Mexico City
}

/**
 * Look up the representative [lon, lat] for a given ISO-3166-1 alpha-2 country code.
 * Returns null if the country is not in the table.
 */
export function getCountryCentroid(countryCode: string): LonLat | null {
  return CENTROIDS[countryCode.toUpperCase()] ?? null
}

/** All known country codes in the centroid table */
export const KNOWN_COUNTRIES = Object.keys(CENTROIDS)
