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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    "id": "dsv-mussafah-warehouse-m44",
    "code": "DSV-M44",
    "name": "DSV M-44 Inland Warehouse(대표)",
    "category": "WAREHOUSE",
    "summary": "Warehouse · DSV (M-44)",
    "coordinates": [
      54.58183,
      24.3447
    ],
    "labelOffset": [
      0,
      18
    ]
  },
  {
    "id": "mosb-esnaad",
    "code": "MOSB",
    "name": "MOSB – Mussafah Offshore Support Base(ESNAAD)",
    "category": "YARD",
    "summary": "Yard · MOSB (ESNAAD)",
    "coordinates": [
      54.46685,
      24.32479
    ],
    "labelOffset": [
      0,
      18
    ]
  },
  {
    "id": "mosb-samsung-yard",
    "code": "MOSB-SAM",
    "name": "MOSB – Samsung Yard(대표)",
    "category": "YARD",
    "summary": "Yard · Samsung (rep.)",
    "coordinates": [
      54.46685,
      24.32479
    ],
    "labelOffset": [
      80,
      -10
    ]
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
    ]
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
    ]
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
    ]
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
