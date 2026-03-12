import type { Layer, PickingInfo } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension } from '@deck.gl/extensions';

import type { PoiLocation, PoiCategory } from '../../lib/map/poiTypes';

export type PoiLayersOptions = {
  pois: ReadonlyArray<PoiLocation>;
  selectedPoiId?: string | null;
  zoom: number;
  onSelectPoi?: (poi: PoiLocation) => void;
  /**
   * If true, labels are always attempted.
   * If false, labels appear only at zoom>=labelZoomThreshold.
   */
  forceLabels?: boolean;
  labelZoomThreshold?: number;
};

function categoryColor(category: PoiCategory): [number, number, number, number] {
  // Minimal, high-contrast palette (RGBA). Adjust to design tokens if present.
  switch (category) {
    case 'HVDC_SITE':
      return [0, 180, 216, 220];
    case 'PORT':
      return [255, 140, 0, 220];
    case 'WAREHOUSE':
      return [34, 197, 94, 220];
    case 'OFFICE':
      return [99, 102, 241, 220];
    case 'YARD':
      return [234, 179, 8, 220];
    case 'AIRPORT':
      return [239, 68, 68, 220];
    default:
      return [148, 163, 184, 220];
  }
}

export function createPoiLayers(opts: PoiLayersOptions): Layer[] {
  const {
    pois,
    selectedPoiId,
    zoom,
    onSelectPoi,
    forceLabels = false,
    labelZoomThreshold = 8.5,
  } = opts;

  const showLabels = forceLabels || zoom >= labelZoomThreshold;

  const pointsLayer = new ScatterplotLayer<PoiLocation>({
    id: 'poi-markers',
    data: pois,
    pickable: true,
    radiusUnits: 'pixels',
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: (d) => (d.id === selectedPoiId ? 10 : 7),
    getFillColor: (d) => categoryColor(d.category),
    getLineColor: [15, 23, 42, 200],
    lineWidthUnits: 'pixels',
    getLineWidth: (d) => (d.id === selectedPoiId ? 2 : 1),
    stroked: true,
    filled: true,
    onClick: (info) => {
      if (!info?.object) return;
      onSelectPoi?.(info.object);
    },
    updateTriggers: {
      getRadius: [selectedPoiId],
      getLineWidth: [selectedPoiId],
    },
  });

  const labelLayer = new TextLayer<PoiLocation>({
    id: 'poi-labels',
    data: pois,
    pickable: true,
    visible: showLabels,
    getPosition: (d) => [d.longitude, d.latitude],
    // Keep this extremely short to reduce overlap risk.
    getText: (d) => `${d.code} · ${d.summary}`,
    sizeUnits: 'pixels',
    getSize: (d) => (d.id === selectedPoiId ? 13 : 12),
    // Slightly above marker
    getPixelOffset: [0, -16],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'bottom',
    getColor: [15, 23, 42, 235],
    background: true,
    getBackgroundColor: [255, 255, 255, 230],
    backgroundPadding: [6, 4],
    // Prevent label overlaps (GPU-side) using CollisionFilterExtension.
    // Priority: show HVDC Sites/Ports before offices/yards if collision occurs.
    extensions: [new CollisionFilterExtension()],
    collisionGroup: 'poi-labels',
    getCollisionPriority: (d) => d.priority,
    collisionTestProps: {
      // Provide additional spacing to reduce near-overlap.
      sizeScale: 1.15,
    },
    onClick: (info) => {
      if (!info?.object) return;
      onSelectPoi?.(info.object);
    },
    updateTriggers: {
      getSize: [selectedPoiId],
      visible: [showLabels],
    },
  });

  return [pointsLayer, labelLayer];
}

export function getPoiTooltip(info: PickingInfo): { text: string } | null {
  const obj = info?.object as PoiLocation | undefined;
  if (!obj) return null;

  const lines: string[] = [];
  lines.push(`${obj.code} · ${obj.name}`);
  if (obj.address) lines.push(obj.address);
  lines.push(obj.summary);

  if (obj.assumptions?.length) {
    lines.push(`Assumption: ${obj.assumptions.join(' | ')}`);
  }

  return { text: lines.join('\n') };
}
