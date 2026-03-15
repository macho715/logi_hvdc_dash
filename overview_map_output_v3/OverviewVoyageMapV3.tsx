
'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type {
  GlobalMapEdge,
  Manifest,
  ShipmentMaster,
  UaeOpsEdge,
  OverviewStage,
  GlobalRouteType,
  UaeOpsRouteType,
} from './overview-map-types';

type ViewMode = 'global' | 'uae_ops';
type NodeKind = 'ORIGIN' | 'POL' | 'PORT' | 'CUSTOMS' | 'WH' | 'MOSB' | 'SITE';

interface Props {
  overviewUrl?: string;
  globalMapUrl?: string;
  uaeOpsMapUrl?: string;
  manifestUrl?: string;
}

const NODE_THEME: Record<NodeKind, { border: string; glow: string; chip: string; text: string }> = {
  ORIGIN: { border: '#818CF8', glow: 'rgba(129,140,248,0.25)', chip: '#312E81', text: '#E0E7FF' },
  POL: { border: '#60A5FA', glow: 'rgba(96,165,250,0.25)', chip: '#1E3A8A', text: '#DBEAFE' },
  PORT: { border: '#3B82F6', glow: 'rgba(59,130,246,0.25)', chip: '#1D4ED8', text: '#DBEAFE' },
  CUSTOMS: { border: '#06B6D4', glow: 'rgba(6,182,212,0.24)', chip: '#164E63', text: '#CFFAFE' },
  WH: { border: '#FACC15', glow: 'rgba(250,204,21,0.20)', chip: '#713F12', text: '#FEF08A' },
  MOSB: { border: '#F97316', glow: 'rgba(249,115,22,0.22)', chip: '#7C2D12', text: '#FED7AA' },
  SITE: { border: '#22C55E', glow: 'rgba(34,197,94,0.24)', chip: '#14532D', text: '#DCFCE7' },
};

const GLOBAL_ROUTE_COLOR: Record<GlobalRouteType, string> = {
  origin_to_pol: '#818CF8',
  pol_to_pod: '#3B82F6',
  pod_to_site: '#7DD3FC',
};

const UAE_ROUTE_COLOR: Record<UaeOpsRouteType, string> = {
  port_to_customs: '#06B6D4',
  customs_to_wh: '#3B82F6',
  customs_to_site: '#7DD3FC',
  customs_to_mosb: '#8B5CF6',
  wh_to_site: '#60A5FA',
  wh_to_mosb: '#A855F7',
  mosb_to_site: '#22C55E',
};

const STAGE_PILL: Record<OverviewStage, string> = {
  pre_arrival: '#64748B',
  in_transit: '#3B82F6',
  arrived_port: '#0EA5E9',
  customs_in_progress: '#F59E0B',
  customs_cleared: '#10B981',
  warehouse_staging: '#8B5CF6',
  mosb_staging: '#F97316',
  at_site: '#22C55E',
  delivered: '#16A34A',
};

function formatCount(n: number): string {
  return n.toLocaleString();
}

function parseNodeLabel(input: string): { kind: NodeKind; label: string } {
  const [kind, ...rest] = input.split(':');
  const label = rest.join(':') || input;
  if (kind === 'ORIGIN' || kind === 'POL' || kind === 'PORT' || kind === 'CUSTOMS' || kind === 'WH' || kind === 'MOSB' || kind === 'SITE') {
    return { kind, label };
  }
  return { kind: 'SITE', label };
}

function dominantLabel(record: Record<string, number>): string {
  const top = Object.entries(record).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] || '-';
}

function renderNodeCard(args: {
  kind: NodeKind;
  label: string;
  total: number;
  subline?: string;
  badge?: string;
}) {
  const theme = NODE_THEME[args.kind];
  return (
    <div
      className="min-w-[190px] rounded-2xl px-4 py-3"
      style={{
        background: 'rgba(2, 6, 23, 0.92)',
        border: `1px solid ${theme.border}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 12px 28px rgba(0,0,0,0.35), 0 0 20px ${theme.glow}`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ backgroundColor: theme.chip, color: theme.text }}
        >
          {args.kind}
        </span>
        {args.badge ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300">
            {args.badge}
          </span>
        ) : null}
      </div>
      <div className="text-sm font-semibold text-white">{args.label}</div>
      <div className="mt-2 text-xs text-slate-300">{formatCount(args.total)} shipments</div>
      {args.subline ? <div className="mt-1 text-[11px] text-slate-400">{args.subline}</div> : null}
    </div>
  );
}

export default function OverviewVoyageMapV3({
  overviewUrl = '/data/overview_master.json',
  globalMapUrl = '/data/global_map.json',
  uaeOpsMapUrl = '/data/uae_ops_map.json',
  manifestUrl = '/data/manifest.json',
}: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [overview, setOverview] = useState<ShipmentMaster[]>([]);
  const [globalMap, setGlobalMap] = useState<GlobalMapEdge[]>([]);
  const [uaeOpsMap, setUaeOpsMap] = useState<UaeOpsEdge[]>([]);
  const [mode, setMode] = useState<ViewMode>('uae_ops');
  const [selectedVendor, setSelectedVendor] = useState<string>('All Vendors');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  useEffect(() => {
    async function loadAll() {
      const [manifestRes, overviewRes, globalRes, uaeRes] = await Promise.all([
        fetch(manifestUrl),
        fetch(overviewUrl),
        fetch(globalMapUrl),
        fetch(uaeOpsMapUrl),
      ]);
      const [manifestJson, overviewJson, globalJson, uaeJson] = await Promise.all([
        manifestRes.json(),
        overviewRes.json(),
        globalRes.json(),
        uaeRes.json(),
      ]);
      setManifest(manifestJson);
      setOverview(overviewJson);
      setGlobalMap(globalJson);
      setUaeOpsMap(uaeJson);
      setMode(manifestJson.default_mode || 'uae_ops');
    }
    void loadAll();
  }, [globalMapUrl, manifestUrl, overviewUrl, uaeOpsMapUrl]);

  const vendorOptions = useMemo(
    () => ['All Vendors', ...(manifest?.vendors || [])],
    [manifest],
  );

  const filteredShipments = useMemo(() => {
    return overview.filter((item) => {
      const vendorOk = selectedVendor === 'All Vendors' || item.vendor === selectedVendor;
      const stageOk = selectedStage === 'all' || item.stage === selectedStage;
      return vendorOk && stageOk;
    });
  }, [overview, selectedStage, selectedVendor]);

  const shipmentIdSet = useMemo(() => new Set(filteredShipments.map((item) => item.shipment_id)), [filteredShipments]);

  const stageCounts = useMemo(() => {
    return filteredShipments.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + 1;
      return acc;
    }, {});
  }, [filteredShipments]);

  const routeCounts = useMemo(() => {
    return filteredShipments.reduce<Record<string, number>>((acc, item) => {
      acc[item.route_family] = (acc[item.route_family] || 0) + 1;
      return acc;
    }, {});
  }, [filteredShipments]);

  const footerStats = useMemo(() => {
    const siteReady = filteredShipments.filter((item) => item.stage === 'at_site' || item.stage === 'delivered').length;
    const customsHold = filteredShipments.filter((item) => item.stage === 'customs_in_progress').length;
    const portPending = filteredShipments.filter((item) => item.stage === 'pre_arrival' || item.stage === 'in_transit' || item.stage === 'arrived_port').length;
    const whDwell = filteredShipments.filter((item) => item.stage === 'warehouse_staging').length;
    const mosbPending = filteredShipments.filter((item) => item.stage === 'mosb_staging').length;
    const activeOrigins = new Set(filteredShipments.map((item) => item.origin_region).filter(Boolean)).size;
    const activePods = new Set(filteredShipments.map((item) => item.pod).filter(Boolean)).size;
    return { siteReady, customsHold, portPending, whDwell, mosbPending, activeOrigins, activePods };
  }, [filteredShipments]);

  const flowData = useMemo(() => {
    const activeGlobalEdges = globalMap.filter((edge) => edge.shipment_ids.some((id) => shipmentIdSet.has(id)));
    const activeUaeEdges = uaeOpsMap.filter((edge) => edge.shipment_ids.some((id) => shipmentIdSet.has(id)));

    type BucketNode = {
      id: string;
      kind: NodeKind;
      label: string;
      column: number;
      total: number;
      subline?: string;
      badge?: string;
      priority?: number;
    };

    const nodesMap = new Map<string, BucketNode>();
    const addNode = (node: BucketNode) => {
      const current = nodesMap.get(node.id);
      if (current) {
        current.total += node.total;
        current.priority = Math.max(current.priority || 0, node.priority || 0);
        return;
      }
      nodesMap.set(node.id, node);
    };

    const edges: Edge[] = [];

    if (mode === 'global') {
      const columnMap: Record<NodeKind, number> = {
        ORIGIN: 0,
        POL: 1,
        PORT: 2,
        CUSTOMS: 3,
        WH: 3,
        MOSB: 3,
        SITE: 3,
      };

      activeGlobalEdges.forEach((edge, index) => {
        const source = parseNodeLabel(edge.source);
        const target = parseNodeLabel(edge.target);

        addNode({
          id: edge.source,
          kind: source.kind,
          label: source.label,
          column: columnMap[source.kind],
          total: edge.shipment_count,
          subline:
            source.kind === 'ORIGIN'
              ? 'Origin Region'
              : source.kind === 'POL'
                ? 'Port of Loading'
                : 'UAE Entry',
          priority: 100 - columnMap[source.kind] * 10,
        });

        addNode({
          id: edge.target,
          kind: target.kind,
          label: target.label,
          column: columnMap[target.kind],
          total: edge.shipment_count,
          subline:
            target.kind === 'POL'
              ? 'Port of Loading'
              : target.kind === 'PORT'
                ? 'POD / Airport'
                : target.kind === 'SITE'
                  ? edge.target_is_offshore
                    ? 'via MOSB route family'
                    : 'Direct / WH route family'
                  : '',
          badge:
            target.kind === 'SITE'
              ? edge.target_is_offshore
                ? 'via MOSB'
                : dominantLabel(edge.site_basis_mix)
              : undefined,
          priority: target.kind === 'SITE' && edge.target_is_offshore ? 150 : 100 - columnMap[target.kind] * 10,
        });

        edges.push({
          id: `g-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: GLOBAL_ROUTE_COLOR[edge.route_type] },
          style: {
            stroke: GLOBAL_ROUTE_COLOR[edge.route_type],
            strokeWidth: edge.route_type === 'pod_to_site' && edge.target_is_offshore ? 2.8 : 2.2,
            opacity: 0.95,
          },
          label: `${edge.shipment_count}`,
          labelStyle: { fill: '#E2E8F0', fontSize: 11 },
        });
      });
    } else {
      const columnMap: Record<NodeKind, number> = {
        ORIGIN: 0,
        POL: 0,
        PORT: 0,
        CUSTOMS: 1,
        WH: 2,
        MOSB: 3,
        SITE: 4,
      };

      activeUaeEdges.forEach((edge, index) => {
        const source = parseNodeLabel(edge.source);
        const target = parseNodeLabel(edge.target);

        addNode({
          id: edge.source,
          kind: source.kind,
          label: source.label,
          column: columnMap[source.kind],
          total: edge.shipment_count,
          subline:
            source.kind === 'PORT'
              ? 'Port / Airport'
              : source.kind === 'CUSTOMS'
                ? 'Customs Node'
                : source.kind === 'WH'
                  ? 'Optional staging'
                  : source.kind === 'MOSB'
                    ? 'Offshore hub'
                    : 'Final site',
        });

        addNode({
          id: edge.target,
          kind: target.kind,
          label: target.label,
          column: columnMap[target.kind],
          total: edge.shipment_count,
          subline:
            target.kind === 'PORT'
              ? 'Port / Airport'
              : target.kind === 'CUSTOMS'
                ? 'Customs Node'
                : target.kind === 'WH'
                  ? 'Optional staging'
                  : target.kind === 'MOSB'
                    ? 'Offshore hub'
                    : target.kind === 'SITE'
                      ? target.label === 'DAS' || target.label === 'AGI'
                        ? 'MOSB mandatory'
                        : 'Direct or WH'
                      : '',
          badge: target.kind === 'SITE' && (target.label === 'DAS' || target.label === 'AGI') ? 'MOSB' : undefined,
        });

        edges.push({
          id: `u-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: UAE_ROUTE_COLOR[edge.route_type] },
          style: {
            stroke: UAE_ROUTE_COLOR[edge.route_type],
            strokeWidth: edge.route_type === 'mosb_to_site' ? 2.8 : 2.2,
            opacity: 0.95,
          },
          label: `${edge.shipment_count}`,
          labelStyle: { fill: '#E2E8F0', fontSize: 11 },
        });
      });
    }

    const columnBuckets: Record<number, BucketNode[]> = {};
    Array.from(nodesMap.values()).forEach((node) => {
      if (!columnBuckets[node.column]) columnBuckets[node.column] = [];
      columnBuckets[node.column].push(node);
    });

    const nodes: Node[] = [];
    Object.entries(columnBuckets).forEach(([columnKey, values]) => {
      const column = Number(columnKey);
      values
        .sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.total - a.total || a.label.localeCompare(b.label))
        .forEach((node, index) => {
          const xByMode = mode === 'global'
            ? [80, 380, 690, 1010]
            : [70, 360, 650, 940, 1230];
          const yBase = 40;
          const yGap = 112;
          nodes.push({
            id: node.id,
            type: 'default',
            position: { x: xByMode[column] ?? (70 + column * 280), y: yBase + index * yGap },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            data: {
              label: renderNodeCard({
                kind: node.kind,
                label: node.label,
                total: node.total,
                subline: node.subline,
                badge: node.badge,
              }),
            },
            draggable: false,
            style: {
              width: 198,
              border: 'none',
              background: 'transparent',
              padding: 0,
            },
          });
        });
    });

    return { nodes, edges };
  }, [globalMap, mode, shipmentIdSet, uaeOpsMap]);

  const legendNodes = mode === 'global'
    ? [
        { label: 'Origin Region', kind: 'ORIGIN' as const },
        { label: 'POL', kind: 'POL' as const },
        { label: 'POD / Airport', kind: 'PORT' as const },
        { label: 'HVDC Site', kind: 'SITE' as const },
      ]
    : [
        { label: 'Port / Airport', kind: 'PORT' as const },
        { label: 'Customs', kind: 'CUSTOMS' as const },
        { label: 'Warehouse', kind: 'WH' as const },
        { label: 'MOSB Yard', kind: 'MOSB' as const },
        { label: 'HVDC Site', kind: 'SITE' as const },
      ];

  const legendRoutes = mode === 'global'
    ? [
        { label: 'Origin → POL', color: GLOBAL_ROUTE_COLOR.origin_to_pol },
        { label: 'POL → POD', color: GLOBAL_ROUTE_COLOR.pol_to_pod },
        { label: 'POD → Site', color: GLOBAL_ROUTE_COLOR.pod_to_site },
      ]
    : [
        { label: 'Port → Customs', color: UAE_ROUTE_COLOR.port_to_customs },
        { label: 'Customs → WH', color: UAE_ROUTE_COLOR.customs_to_wh },
        { label: 'Customs → Site', color: UAE_ROUTE_COLOR.customs_to_site },
        { label: 'Customs / WH → MOSB', color: UAE_ROUTE_COLOR.wh_to_mosb },
        { label: 'MOSB → DAS / AGI', color: UAE_ROUTE_COLOR.mosb_to_site },
      ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#081121] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/80">AGENTS.md compliant voyage map v3</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {mode === 'global' ? 'Global Supply Map' : 'UAE Ops Network Map'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'global'
              ? 'Origin → POL → POD / Airport → Final Site allocation · Flow Code not used'
              : 'Port / Air → Customs → (WH optional) → (MOSB optional) → Site · AGI/DAS via MOSB'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-full border px-4 py-2 text-sm ${mode === 'global' ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
            onClick={() => setMode('global')}
          >
            Global
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm ${mode === 'uae_ops' ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
            onClick={() => setMode('uae_ops')}
          >
            UAE Ops
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[290px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Node Legend</div>
            <div className="mt-3 space-y-2">
              {legendNodes.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-slate-200">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: NODE_THEME[item.kind].border }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Route Legend</div>
            <div className="mt-3 space-y-2">
              {legendRoutes.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="inline-flex h-[2px] w-8 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Filters</div>
            <div className="mt-3 space-y-3">
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
              >
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full border px-3 py-1 text-xs ${selectedStage === 'all' ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                  onClick={() => setSelectedStage('all')}
                >
                  All Stages
                </button>
                {(manifest?.stage_order || []).map((stage) => (
                  <button
                    key={stage}
                    className={`rounded-full border px-3 py-1 text-xs ${selectedStage === stage ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                    onClick={() => setSelectedStage(stage)}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Compliance Notes</div>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {(manifest?.assumptions || []).slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="rounded-[24px] border border-white/10 bg-[#050c17] p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <div key={stage} className="rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: STAGE_PILL[stage as OverviewStage] || '#334155' }}>
                {stage} · {count}
              </div>
            ))}
          </div>

          <div className="h-[720px] rounded-[20px] border border-white/10 bg-[#020617]">
            <ReactFlow
              fitView
              nodes={flowData.nodes}
              edges={flowData.edges}
              minZoom={0.4}
              maxZoom={1.4}
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap pannable zoomable nodeColor={() => '#0f172a'} />
              <Controls showInteractive={false} />
              <Background gap={22} size={1} color="rgba(148,163,184,0.08)" />
            </ReactFlow>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Port Pending</div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(footerStats.portPending)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Customs Hold</div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(footerStats.customsHold)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">WH Dwell</div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(footerStats.whDwell)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">MOSB Pending</div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(footerStats.mosbPending)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Site Ready</div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(footerStats.siteReady)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Route Mix</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(routeCounts).map(([key, value]) => (
              <span key={key} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                {key}:{value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
