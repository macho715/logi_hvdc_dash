/* Auto-generated POI SSOT for MapView overlay.
 * Source: map.md coordinate table (WGS84, Decimal · 6자리).
 */

export type HvdcPoiCategory =
  | 'HVDC_SITE'
  | 'OFFICE'
  | 'WAREHOUSE'
  | 'YARD'
  | 'PORT'
  | 'AIRPORT'
  | 'OTHER';

export type HvdcPoi = {
  id: string;
  code: string;
  name: string;
  category: HvdcPoiCategory;
  summary: string;
  /** [lng, lat] */
  coordinates: [number, number];
  /** pixel offset for label collision avoidance */
  labelOffset?: [number, number];
  /**
   * Optional unified display label (abbreviation) for map rendering.
   * If present, used instead of `${code} · ${summary}` format.
   */
  displayLabel?: string;
};

export const HVDC_POIS: HvdcPoi[] = [
  {
    "id": "agi-jetty",
    "code": "AGI",
    "name": "AGI – Al Ghallan Island (Jetty 대표)",
    "category": "HVDC_SITE",
    "summary": "HVDC Site · Jetty (rep.)",
    "coordinates": [
      53.658619,
      24.841096
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "AGI"
  },
  {
    "id": "das-island",
    "code": "DAS",
    "name": "DAS – Das Island(섬 중심)",
    "category": "HVDC_SITE",
    "summary": "HVDC Site · Island",
    "coordinates": [
      52.875,
      25.1477
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "DAS"
  },
  {
    "id": "mirfa-iwpp",
    "code": "MIR",
    "name": "MIR – Mirfa IWPP(플랜트)",
    "category": "HVDC_SITE",
    "summary": "HVDC Site · IWPP",
    "coordinates": [
      53.44436,
      24.11885
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "MIR"
  },
  {
    "id": "shuweihat-complex",
    "code": "SHU",
    "name": "SHU – Shuweihat Complex(단지 중심)",
    "category": "HVDC_SITE",
    "summary": "HVDC Site · Complex",
    "coordinates": [
      52.57292,
      24.16017
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "SHU"
  },
  {
    "id": "dsv-mussafah-office-m19",
    "code": "DSV-M19",
    "name": "DSV Mussafah 사무실(M-19)",
    "category": "OFFICE",
    "summary": "Office · DSV (M-19)",
    "coordinates": [
      54.476102,
      24.366698
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "DSV OFFICE"
  },
  {
    "id": "dsv-inland-warehouse-m44",
    "code": "DSV-WH",
    "name": "DSV Inland Warehouse (M-44)",
    "category": "WAREHOUSE",
    "summary": "Warehouse · DSV Inland WH",
    "coordinates": [
      54.47772,
      24.347077
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "DSV WAREHOUSE"
  },
  {
    "id": "mosb-yard",
    "code": "MOSB-YARD",
    "name": "MOSB YARD",
    "category": "YARD",
    "summary": "Yard · MOSB YARD",
    "coordinates": [
      54.456911,
      24.331414
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "MOSB YARD"
  },
  {
    "id": "mosb-sct-office",
    "code": "MOSB-SCT",
    "name": "MOSB-SCT Office",
    "category": "OFFICE",
    "summary": "Office · MOSB-SCT",
    "coordinates": [
      54.46685,
      24.32479
    ],
    "labelOffset": [
      -20,
      18
    ],
    "displayLabel": "MOSB-SCT"
  },
  {
    "id": "zayed-port",
    "code": "MZP",
    "name": "Mina Zayed Port(대표)",
    "category": "PORT",
    "summary": "Port · Zayed",
    "coordinates": [
      54.37798,
      24.52489
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "MZP"
  },
  {
    "id": "khalifa-port-kpct",
    "code": "KPP",
    "name": "Khalifa Port – KPCT",
    "category": "PORT",
    "summary": "Port · Khalifa (KPCT)",
    "coordinates": [
      54.64842,
      24.8095
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "KPP"
  },
  {
    "id": "auh-airport",
    "code": "AUH",
    "name": "Abu Dhabi(Zayed) International Airport – AUH",
    "category": "AIRPORT",
    "summary": "Airport · AUH",
    "coordinates": [
      54.6492,
      24.441
    ],
    "labelOffset": [
      0,
      18
    ],
    "displayLabel": "AUH"
  }
] as const;

export function poiColor(category: HvdcPoiCategory): [number, number, number, number] {
  switch (category) {
    case 'HVDC_SITE':
      return [0, 102, 204, 200];
    case 'PORT':
      return [255, 153, 0, 200];
    case 'AIRPORT':
      return [153, 51, 255, 200];
    case 'WAREHOUSE':
      return [0, 153, 51, 200];
    case 'OFFICE':
      return [51, 51, 51, 200];
    case 'YARD':
      return [204, 0, 0, 200];
    default:
      return [120, 120, 120, 200];
  }
}
