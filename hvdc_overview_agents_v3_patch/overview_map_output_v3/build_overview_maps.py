
from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import pandas as pd

SITE_COLS = ['SHU', 'MIR', 'DAS', 'AGI']
PLANNED_SITE_COLS = ['DOC_SHU', 'DOC_MIR', 'DOC_DAS', 'DOC_AGI']
ONSHORE_SITES = {'SHU', 'MIR'}
OFFSHORE_SITES = {'DAS', 'AGI'}
WH_COLS = [
    'DSV Indoor',
    'DSV Outdoor',
    'DSV MZD',
    'DSV Kizad',
    'JDN MZD',
    'JDN Waterfront',
    'AAA Storage',
    'ZENER (WH)',
    'Hauler DG Storage',
    'Vijay Tanks',
]
DETAIL_KEEP_COLS = [
    'SCT SHIP NO.',
    'Case No.',
    'EQ No',
    'Source_Vendor',
    'Site',
    'Final_Location',
    'Status_Current',
    'Status_Location',
    'Status_Location_Date',
    'FLOW_CODE',
    'FLOW_DESCRIPTION',
    'DSV Indoor',
    'DSV Al Markaz',
    'AAA Storage',
    'DSV Outdoor',
    'DSV MZP',
    'MOSB',
    'Hauler Indoor',
    'JDN MZD',
    'MIR',
    'SHU',
    'DAS',
    'AGI',
]

STAGE_ORDER = [
    'pre_arrival',
    'in_transit',
    'arrived_port',
    'customs_in_progress',
    'customs_cleared',
    'warehouse_staging',
    'mosb_staging',
    'at_site',
    'delivered',
]
SITE_ORDER = ['SHU', 'MIR', 'DAS', 'AGI']

PORT_NORMALIZE = {
    'Khalifa': 'Khalifa Port',
    'Khalifa port': 'Khalifa Port',
    'Khalifa Port': 'Khalifa Port',
    'Mina zayed': 'Mina Zayed',
    'Mina Zayed': 'Mina Zayed',
    'Abu Dhabi Airport': 'AUH Airport',
    "Abu Dhabi Int'l Airport": 'AUH Airport',
    'AUH Airport': 'AUH Airport',
}
CUSTOMS_MAP = {
    'Khalifa Port': 'Khalifa Customs',
    'Mina Zayed': 'Mina Zayed Customs',
    'AUH Airport': 'AUH Customs',
}

ASSUMPTIONS = [
    '[ASSUMPTION] Global map keeps POL as a first-class node because AGENTS.md canonical path is origin_region -> pol -> pod -> site_cluster.',
    '[ASSUMPTION] UAE Ops map collapses multiple warehouse columns into one label `DSV WH` for overview readability. Detailed warehouse stops remain preserved in wh_detail.json.',
    '[ASSUMPTION] AGI/DAS planned or actual sites imply MOSB routing in UAE Ops pathing, but Overview stage uses MOSB cell milestone only.',
    '[ASSUMPTION] Unknown or blank POD values fall back to `Unknown Entry` / `Unknown Customs` labels instead of inventing port semantics.',
]

WAREHOUSE_LABEL = 'DSV WH'


@dataclass
class ShipmentMaster:
    shipment_id: str
    vendor: str
    category: str
    origin_region: str
    pol: str
    pod: str
    etd: str | None
    atd: str | None
    eta: str | None
    ata: str | None
    customs_start: str | None
    customs_close: str | None
    planned_sites: list[str]
    actual_sites: list[str]
    site_basis: str
    stage: str
    has_wh: bool
    mosb_milestone: bool
    offshore_routing_required: bool
    warehouse_nodes: list[str]
    final_delivery: bool
    final_delivery_date: str | None
    route_family: str
    cif_value: float | None
    gwt_kg: float | None


def is_blank(value: Any) -> bool:
    if pd.isna(value):
        return True
    if isinstance(value, str) and value.strip() == '':
        return True
    return False


def clean_text(value: Any) -> str:
    return '' if is_blank(value) else str(value).strip()


def iso_date(value: Any) -> str | None:
    if is_blank(value):
        return None
    ts = pd.to_datetime(value, errors='coerce')
    if pd.isna(ts):
        return None
    return ts.strftime('%Y-%m-%d')


def normalize_port(value: Any) -> str:
    text = clean_text(value)
    if not text:
        return 'Unknown Entry'
    return PORT_NORMALIZE.get(text, text)


def customs_label(pod: str) -> str:
    if not pod or pod == 'Unknown Entry':
        return 'Unknown Customs'
    return CUSTOMS_MAP.get(pod, f'{pod} Customs')


def actual_sites(row: pd.Series) -> list[str]:
    return [site for site in SITE_COLS if not is_blank(row.get(site))]


def planned_sites(row: pd.Series) -> list[str]:
    out: list[str] = []
    for col in PLANNED_SITE_COLS:
        if not is_blank(row.get(col)):
            out.append(col.replace('DOC_', ''))
    return out


def warehouse_nodes(row: pd.Series) -> list[str]:
    return [col for col in WH_COLS if not is_blank(row.get(col))]


def calc_stage(row: pd.Series) -> str:
    if not is_blank(row.get('FINAL DELIVERY')):
        return 'delivered'
    if any(not is_blank(row.get(site)) for site in SITE_COLS):
        return 'at_site'
    if not is_blank(row.get('MOSB')):
        return 'mosb_staging'
    if any(not is_blank(row.get(col)) for col in WH_COLS):
        return 'warehouse_staging'
    if not is_blank(row.get('Customs Close')):
        return 'customs_cleared'
    if not is_blank(row.get('Customs Start')):
        return 'customs_in_progress'
    if not is_blank(row.get('ATA')):
        return 'arrived_port'
    if not is_blank(row.get('ETA')) or not is_blank(row.get('ATD')) or not is_blank(row.get('ETD')):
        return 'in_transit'
    return 'pre_arrival'


def route_family(sites: list[str], has_wh: bool) -> str:
    site_set = set(sites)
    has_onshore = bool(site_set & ONSHORE_SITES)
    has_offshore = bool(site_set & OFFSHORE_SITES)
    if has_onshore and has_offshore:
        return 'mixed'
    if has_offshore and has_wh:
        return 'via_wh_mosb'
    if has_offshore:
        return 'via_mosb'
    if has_wh:
        return 'via_wh'
    return 'direct'


def load_sheet(path: Path, sheet_name: str) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=sheet_name)
    df.columns = [str(col).strip() for col in df.columns]
    return df


def build_overview_master(df: pd.DataFrame) -> list[ShipmentMaster]:
    items: list[ShipmentMaster] = []
    for _, row in df.iterrows():
        shipment_id = clean_text(row.get('SCT SHIP NO.'))
        if not shipment_id:
            continue
        a_sites = actual_sites(row)
        p_sites = planned_sites(row)
        sites = a_sites or p_sites
        wh_nodes = warehouse_nodes(row)
        mosb_milestone = not is_blank(row.get('MOSB'))
        offshore_routing_required = any(site in OFFSHORE_SITES for site in sites)

        items.append(
            ShipmentMaster(
                shipment_id=shipment_id,
                vendor=clean_text(row.get('VENDOR')),
                category=clean_text(row.get('CATEGORY')),
                origin_region=clean_text(row.get('COE')).title(),
                pol=clean_text(row.get('POL')) or 'Unknown POL',
                pod=normalize_port(row.get('POD')),
                etd=iso_date(row.get('ETD')),
                atd=iso_date(row.get('ATD')),
                eta=iso_date(row.get('ETA')),
                ata=iso_date(row.get('ATA')),
                customs_start=iso_date(row.get('Customs Start')),
                customs_close=iso_date(row.get('Customs Close')),
                planned_sites=p_sites,
                actual_sites=a_sites,
                site_basis='actual' if a_sites else 'planned',
                stage=calc_stage(row),
                has_wh=bool(wh_nodes),
                mosb_milestone=mosb_milestone,
                offshore_routing_required=offshore_routing_required,
                warehouse_nodes=wh_nodes,
                final_delivery=not is_blank(row.get('FINAL DELIVERY')),
                final_delivery_date=iso_date(row.get('FINAL DELIVERY')),
                route_family=route_family(sites, bool(wh_nodes)),
                cif_value=None if is_blank(row.get('CIF VALUE (A+B+C)')) else float(row.get('CIF VALUE (A+B+C)')),
                gwt_kg=None if is_blank(row.get('GWT (KG)')) else float(row.get('GWT (KG)')),
            )
        )
    return items


def active_sites(item: ShipmentMaster) -> list[str]:
    return item.actual_sites or item.planned_sites or ['UNASSIGNED']


def summarize_stage(items: list[ShipmentMaster]) -> dict[str, int]:
    out = {stage: 0 for stage in STAGE_ORDER}
    for item in items:
        out[item.stage] = out.get(item.stage, 0) + 1
    return out


def summarize_route_family(items: list[ShipmentMaster]) -> dict[str, int]:
    out: dict[str, int] = {}
    for item in items:
        out[item.route_family] = out.get(item.route_family, 0) + 1
    return dict(sorted(out.items(), key=lambda kv: (-kv[1], kv[0])))


def build_global_map(items: list[ShipmentMaster]) -> list[dict[str, Any]]:
    buckets: dict[tuple[str, str, str, str, str], dict[str, Any]] = {}

    def add_edge(source: str, target: str, route_type: str, item: ShipmentMaster, site: str) -> None:
        key = (source, target, route_type, site, item.site_basis)
        if key not in buckets:
            buckets[key] = {
                'source': source,
                'target': target,
                'route_type': route_type,
                'shipment_count': 0,
                'target_site': site,
                'target_is_offshore': site in OFFSHORE_SITES,
                'vendor_mix': {},
                'stage_mix': {},
                'pol_mix': {},
                'pod_mix': {},
                'site_basis_mix': {'actual': 0, 'planned': 0},
                'route_family_mix': {},
                'shipment_ids': [],
                'total_gwt_kg': 0.0,
                'total_cif_value': 0.0,
            }
        bucket = buckets[key]
        bucket['shipment_count'] += 1
        bucket['vendor_mix'][item.vendor] = bucket['vendor_mix'].get(item.vendor, 0) + 1
        bucket['stage_mix'][item.stage] = bucket['stage_mix'].get(item.stage, 0) + 1
        bucket['pol_mix'][item.pol] = bucket['pol_mix'].get(item.pol, 0) + 1
        bucket['pod_mix'][item.pod] = bucket['pod_mix'].get(item.pod, 0) + 1
        bucket['site_basis_mix'][item.site_basis] = bucket['site_basis_mix'].get(item.site_basis, 0) + 1
        bucket['route_family_mix'][item.route_family] = bucket['route_family_mix'].get(item.route_family, 0) + 1
        bucket['shipment_ids'].append(item.shipment_id)
        bucket['total_gwt_kg'] += item.gwt_kg or 0.0
        bucket['total_cif_value'] += item.cif_value or 0.0

    for item in items:
        for site in active_sites(item):
            add_edge(f'ORIGIN:{item.origin_region or "Unknown Origin"}', f'POL:{item.pol}', 'origin_to_pol', item, site)
            add_edge(f'POL:{item.pol}', f'PORT:{item.pod}', 'pol_to_pod', item, site)
            add_edge(f'PORT:{item.pod}', f'SITE:{site}', 'pod_to_site', item, site)

    return sorted(
        buckets.values(),
        key=lambda x: (-x['shipment_count'], x['route_type'], x['source'], x['target'], x['target_site']),
    )


def build_uae_ops_map(items: list[ShipmentMaster]) -> list[dict[str, Any]]:
    buckets: dict[tuple[str, str, str], dict[str, Any]] = {}

    def add_edge(source: str, target: str, route_type: str, item: ShipmentMaster) -> None:
        key = (source, target, route_type)
        if key not in buckets:
            buckets[key] = {
                'source': source,
                'target': target,
                'route_type': route_type,
                'shipment_count': 0,
                'vendor_mix': {},
                'stage_mix': {},
                'shipment_ids': [],
                'warehouse_mix': {},
                'site_mix': {},
            }
        bucket = buckets[key]
        bucket['shipment_count'] += 1
        bucket['vendor_mix'][item.vendor] = bucket['vendor_mix'].get(item.vendor, 0) + 1
        bucket['stage_mix'][item.stage] = bucket['stage_mix'].get(item.stage, 0) + 1
        bucket['shipment_ids'].append(item.shipment_id)
        for wh in item.warehouse_nodes:
            bucket['warehouse_mix'][wh] = bucket['warehouse_mix'].get(wh, 0) + 1
        for site in active_sites(item):
            bucket['site_mix'][site] = bucket['site_mix'].get(site, 0) + 1

    for item in items:
        pod = item.pod or 'Unknown Entry'
        port_node = f'PORT:{pod}'
        customs_node = f'CUSTOMS:{customs_label(pod)}'
        wh_node = f'WH:{WAREHOUSE_LABEL}'
        mosb_node = 'MOSB:MOSB'
        sites = active_sites(item)

        add_edge(port_node, customs_node, 'port_to_customs', item)

        onshore_sites = [site for site in sites if site in ONSHORE_SITES or site == 'UNASSIGNED']
        offshore_sites = [site for site in sites if site in OFFSHORE_SITES]

        if item.has_wh:
            add_edge(customs_node, wh_node, 'customs_to_wh', item)
            for site in onshore_sites:
                add_edge(wh_node, f'SITE:{site}', 'wh_to_site', item)
            if offshore_sites:
                add_edge(wh_node, mosb_node, 'wh_to_mosb', item)
                for site in offshore_sites:
                    add_edge(mosb_node, f'SITE:{site}', 'mosb_to_site', item)
        else:
            for site in onshore_sites:
                add_edge(customs_node, f'SITE:{site}', 'customs_to_site', item)
            if offshore_sites:
                add_edge(customs_node, mosb_node, 'customs_to_mosb', item)
                for site in offshore_sites:
                    add_edge(mosb_node, f'SITE:{site}', 'mosb_to_site', item)

    return sorted(buckets.values(), key=lambda x: (-x['shipment_count'], x['route_type'], x['source'], x['target']))


def build_vendor_summary(items: list[ShipmentMaster]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for item in items:
        bucket = out.setdefault(item.vendor, {
            'shipment_count': 0,
            'stages': {},
            'pods': {},
            'sites': {},
            'route_families': {},
        })
        bucket['shipment_count'] += 1
        bucket['stages'][item.stage] = bucket['stages'].get(item.stage, 0) + 1
        bucket['pods'][item.pod] = bucket['pods'].get(item.pod, 0) + 1
        bucket['route_families'][item.route_family] = bucket['route_families'].get(item.route_family, 0) + 1
        for site in active_sites(item):
            bucket['sites'][site] = bucket['sites'].get(site, 0) + 1
    return dict(sorted(out.items(), key=lambda kv: (-kv[1]['shipment_count'], kv[0])))


def build_wh_detail(wh_df: pd.DataFrame) -> list[dict[str, Any]]:
    cols = [col for col in DETAIL_KEEP_COLS if col in wh_df.columns]
    detail = wh_df[cols].copy()

    def _json_safe(value: Any) -> Any:
        if pd.isna(value):
            return ''
        if isinstance(value, pd.Timestamp):
            return value.strftime('%Y-%m-%d')
        return str(value).strip() if isinstance(value, str) else value

    detail = detail.map(_json_safe)
    return detail.to_dict(orient='records')


def build_cargo_drilldown(wh_df: pd.DataFrame) -> list[dict[str, Any]]:
    for required in ['SCT SHIP NO.', 'Final_Location', 'FLOW_CODE']:
        if required not in wh_df.columns:
            return []
    vendor_col = 'Source_Vendor' if 'Source_Vendor' in wh_df.columns else None
    status_col = 'Status_Current' if 'Status_Current' in wh_df.columns else None
    df = wh_df.copy()
    df['Final_Location'] = df['Final_Location'].fillna('UNKNOWN').astype(str)
    df['FLOW_CODE'] = df['FLOW_CODE'].fillna('UNKNOWN').astype(str)
    if vendor_col:
        df[vendor_col] = df[vendor_col].fillna('UNKNOWN').astype(str)
    if status_col:
        df[status_col] = df[status_col].fillna('UNKNOWN').astype(str)
    group_cols = ['SCT SHIP NO.', 'Final_Location', 'FLOW_CODE']
    if vendor_col:
        group_cols.append(vendor_col)
    if status_col:
        group_cols.append(status_col)
    grouped = (
        df.groupby(group_cols, dropna=False)
        .size()
        .reset_index(name='case_count')
        .sort_values(['SCT SHIP NO.', 'case_count'], ascending=[True, False])
    )
    return grouped.to_dict(orient='records')


def build_flow_code_summary(wh_df: pd.DataFrame) -> list[dict[str, Any]]:
    if 'FLOW_CODE' not in wh_df.columns:
        return []
    df = wh_df.copy()
    df['FLOW_CODE'] = df['FLOW_CODE'].fillna('UNKNOWN').astype(str)
    df['Final_Location'] = df['Final_Location'].fillna('UNKNOWN').astype(str) if 'Final_Location' in df.columns else 'UNKNOWN'
    df['Source_Vendor'] = df['Source_Vendor'].fillna('UNKNOWN').astype(str) if 'Source_Vendor' in df.columns else 'UNKNOWN'
    grouped = (
        df.groupby(['FLOW_CODE', 'Final_Location', 'Source_Vendor'], dropna=False)
        .size()
        .reset_index(name='case_count')
        .sort_values(['FLOW_CODE', 'case_count'], ascending=[True, False])
    )
    return grouped.to_dict(orient='records')


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description='Build AGENTS-compliant overview/detail JSON assets.')
    parser.add_argument('--input', type=Path, default=Path('HVDC STATUS1.xlsx'))
    parser.add_argument('--outdir', type=Path, default=Path('overview_map_output_v3'))
    args = parser.parse_args()

    out_dir = args.outdir
    out_dir.mkdir(parents=True, exist_ok=True)

    hvdc_df = load_sheet(args.input, 'hvdc all status')
    wh_df = load_sheet(args.input, 'wh status')

    overview_items = build_overview_master(hvdc_df)
    overview_master = [asdict(item) for item in overview_items]
    global_map = build_global_map(overview_items)
    uae_ops_map = build_uae_ops_map(overview_items)
    vendor_summary = build_vendor_summary(overview_items)

    wh_detail = build_wh_detail(wh_df)
    cargo_drilldown = build_cargo_drilldown(wh_df)
    flow_code_summary = build_flow_code_summary(wh_df)

    manifest = {
        'input_file': args.input.name,
        'overview_shipments': len(overview_master),
        'global_edges': len(global_map),
        'uae_ops_edges': len(uae_ops_map),
        'vendors': sorted({item['vendor'] for item in overview_master if item['vendor']}),
        'stage_counts': summarize_stage(overview_items),
        'route_family_counts': summarize_route_family(overview_items),
        'site_order': SITE_ORDER,
        'stage_order': STAGE_ORDER,
        'default_mode': 'uae_ops',
        'warehouse_label': WAREHOUSE_LABEL,
        'assumptions': ASSUMPTIONS,
        'compliance': {
            'overview_uses_hvdc_all_status_only': True,
            'overview_flow_code_dependency': False,
            'planned_actual_separated': True,
            'actual_overrides_planned': True,
            'vendor_dynamic': True,
            'wh_optional_in_overview': True,
            'global_path_includes_pol': True,
            'detail_outputs_use_wh_status_and_flow_code': True,
        },
        'detail_outputs': {
            'wh_detail_rows': len(wh_detail),
            'cargo_drilldown_rows': len(cargo_drilldown),
            'flow_code_summary_rows': len(flow_code_summary),
        },
    }

    write_json(out_dir / 'overview_master.json', overview_master)
    write_json(out_dir / 'global_map.json', global_map)
    write_json(out_dir / 'uae_ops_map.json', uae_ops_map)
    write_json(out_dir / 'vendor_summary.json', vendor_summary)
    write_json(out_dir / 'wh_detail.json', wh_detail)
    write_json(out_dir / 'cargo_drilldown.json', cargo_drilldown)
    write_json(out_dir / 'flow_code_summary.json', flow_code_summary)
    write_json(out_dir / 'manifest.json', manifest)

    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
