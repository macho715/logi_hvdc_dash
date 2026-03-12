/**
 * POI types for map layer (reakmapping §3).
 */

export type PoiCategory =
  | "HVDC_SITE"
  | "PORT"
  | "WAREHOUSE"
  | "OFFICE"
  | "YARD"
  | "AIRPORT"

export type PoiLocation = {
  id: string
  code: string
  name: string
  category: PoiCategory

  latitude: number
  longitude: number

  /**
   * Optional display jitter (decimal degrees) applied only for map rendering.
   * Tuple order: [lngDelta, latDelta]
   */
  displayJitter?: [number, number]

  /**
   * Optional label pixel offset for map rendering.
   * Tuple order: [xPx, yPx]
   */
  labelOffsetPx?: [number, number]

  summary: string
  address?: string
  priority?: number
  tags?: string[]
  /**
   * Optional unified display label (abbreviation) for map rendering.
   * If present, used instead of `${code} - ${summary}` format.
   */
  displayLabel?: string
}
