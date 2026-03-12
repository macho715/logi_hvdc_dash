export type PoiCategory =
  | 'HVDC_SITE'
  | 'PORT'
  | 'WAREHOUSE'
  | 'OFFICE'
  | 'YARD'
  | 'AIRPORT';

export interface PoiLocation {
  /** Stable slug (URL-safe). Example: "agi-jetty" */
  id: string;

  /** Short code used by ops teams. Example: "AGI", "MIR", "AUH" */
  code: string;

  /** Human-readable name */
  name: string;

  /** Category used for styling and filtering */
  category: PoiCategory;

  /** WGS84 decimal degrees */
  latitude: number;
  longitude: number;

  /** Optional address string (public/ops-safe) */
  address?: string;

  /** 1-line summary designed to fit on-map without heavy overlap */
  summary: string;

  /** Collision priority (higher shows first when labels collide) */
  priority: number;

  /** Source marker for traceability */
  source?: string;

  /** Explicit assumptions to keep uncertainty visible */
  assumptions?: string[];
}
