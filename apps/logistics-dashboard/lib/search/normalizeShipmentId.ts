/**
 * Normalized shipment search query.
 * - exact: use GET /api/shipments?sct_ship_no={value} (exact match)
 * - ilike: use GET /api/shipments?q={value} (partial ilike match)
 */
export type NormalizedSearch =
  | { type: 'exact'; value: string }
  | { type: 'ilike'; value: string }

/**
 * Normalizes a raw user search string into a structured search query.
 *
 * Supported input formats (case-insensitive):
 *   hvdc-adopt-sct-0001  → exact HVDC-ADOPT-SCT-0001
 *   sct0001 / sct001     → exact HVDC-ADOPT-SCT-0001
 *   sct0123 / sct123     → exact HVDC-ADOPT-SCT-0123
 *   case12345            → ilike %12345%
 *   0001 / free text     → ilike %0001%
 */
export function normalizeShipmentId(raw: string): NormalizedSearch {
  const s = raw.trim().toLowerCase()

  // Full HVDC code: must start with "hvdc-" (hyphen required) to be a valid HVDC code
  // e.g. "hvdc-adopt-sct-0001" → exact match against sct_ship_no
  // bare "hvdc" or "hvdcfoo" without hyphen falls through to ilike
  if (s.startsWith('hvdc-')) {
    return { type: 'exact', value: s.toUpperCase() }
  }

  // Short SCT code: sct followed by 1–4 digits only → zero-pad to 4 digits
  // 5+ digit SCT codes are non-standard and fall to ilike fallback
  const sctMatch = s.match(/^sct(\d{1,4})$/)
  if (sctMatch) {
    const padded = sctMatch[1].padStart(4, '0')
    return { type: 'exact', value: `HVDC-ADOPT-SCT-${padded}` }
  }

  // Case number: strip "case" prefix, use bare digits as ilike value against sct_ship_no
  const caseMatch = s.match(/^case(\d+)$/)
  if (caseMatch) {
    return { type: 'ilike', value: caseMatch[1] }
  }

  // Bare numerics, vendor names, 5+ digit sct codes, and all other inputs
  // → partial ilike match against sct_ship_no
  return { type: 'ilike', value: s }
}
