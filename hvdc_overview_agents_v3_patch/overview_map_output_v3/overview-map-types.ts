
export type OverviewStage =
  | 'pre_arrival'
  | 'in_transit'
  | 'arrived_port'
  | 'customs_in_progress'
  | 'customs_cleared'
  | 'warehouse_staging'
  | 'mosb_staging'
  | 'at_site'
  | 'delivered';

export type RouteFamily = 'direct' | 'via_wh' | 'via_mosb' | 'via_wh_mosb' | 'mixed';

export type GlobalRouteType = 'origin_to_pol' | 'pol_to_pod' | 'pod_to_site';

export type UaeOpsRouteType =
  | 'port_to_customs'
  | 'customs_to_wh'
  | 'customs_to_site'
  | 'customs_to_mosb'
  | 'wh_to_site'
  | 'wh_to_mosb'
  | 'mosb_to_site';

export interface ShipmentMaster {
  shipment_id: string;
  vendor: string;
  category: string;
  origin_region: string;
  pol: string;
  pod: string;
  etd?: string | null;
  atd?: string | null;
  eta?: string | null;
  ata?: string | null;
  customs_start?: string | null;
  customs_close?: string | null;
  planned_sites: string[];
  actual_sites: string[];
  site_basis: 'actual' | 'planned';
  stage: OverviewStage;
  has_wh: boolean;
  mosb_milestone: boolean;
  offshore_routing_required: boolean;
  warehouse_nodes: string[];
  final_delivery: boolean;
  final_delivery_date?: string | null;
  route_family: RouteFamily;
  cif_value?: number | null;
  gwt_kg?: number | null;
}

export interface GlobalMapEdge {
  source: string;
  target: string;
  route_type: GlobalRouteType;
  shipment_count: number;
  target_site: string;
  target_is_offshore: boolean;
  vendor_mix: Record<string, number>;
  stage_mix: Record<string, number>;
  pol_mix: Record<string, number>;
  pod_mix: Record<string, number>;
  site_basis_mix: Record<'actual' | 'planned', number>;
  route_family_mix: Record<string, number>;
  shipment_ids: string[];
  total_gwt_kg: number;
  total_cif_value: number;
}

export interface UaeOpsEdge {
  source: string;
  target: string;
  route_type: UaeOpsRouteType;
  shipment_count: number;
  vendor_mix: Record<string, number>;
  stage_mix: Record<string, number>;
  shipment_ids: string[];
  warehouse_mix: Record<string, number>;
  site_mix: Record<string, number>;
}

export interface Manifest {
  input_file: string;
  overview_shipments: number;
  global_edges: number;
  uae_ops_edges: number;
  vendors: string[];
  stage_counts: Record<string, number>;
  route_family_counts: Record<string, number>;
  site_order: string[];
  stage_order: OverviewStage[];
  default_mode: 'global' | 'uae_ops';
  warehouse_label: string;
  assumptions: string[];
  compliance: Record<string, boolean>;
  detail_outputs: Record<string, number>;
}
