import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';

import { HVDC_POIS, poiColor, type HvdcPoi } from '../../lib/map/hvdcPoiLocations';

/**
 * HVDC POI layers (static coordinates).
 *
 * 목적:
 * - Supabase 데이터 로드/정합성 이전에도 지도에 실제 현장(AGI/DAS/MIR/SHU 등) 좌표를 항상 표시
 * - 기존 LocationLayer(동적)와는 별개 오버레이로 동작 (필요 시 추후 통합 가능)
 */
export function createHvdcPoiLayers(): Layer[] {
  const points = new ScatterplotLayer<HvdcPoi>({
    id: 'hvdc-pois-points',
    data: HVDC_POIS,
    pickable: true,
    autoHighlight: true,
    radiusUnits: 'meters',
    radiusMinPixels: 4,
    radiusMaxPixels: 18,
    getPosition: (d) => d.coordinates,
    getRadius: () => 2500,
    getFillColor: (d) => poiColor(d.category),
    getLineColor: () => [255, 255, 255, 220],
    lineWidthMinPixels: 1
  });

  const labels = new TextLayer<HvdcPoi>({
    id: 'hvdc-pois-labels',
    data: HVDC_POIS,
    pickable: false,
    billboard: true,
    sizeUnits: 'pixels',
    sizeMinPixels: 10,
    sizeMaxPixels: 14,
    getPosition: (d) => d.coordinates,
    getText: (d) => `${d.code} · ${d.summary}`,
    getSize: () => 11,
    getColor: () => [10, 10, 10, 235],
    getBackgroundColor: () => [255, 255, 255, 220],
    background: true,
    getBorderColor: () => [0, 0, 0, 40],
    getBorderWidth: () => 1,
    getPixelOffset: (d) => d.labelOffset ?? [0, 18]
  });

  return [points, labels];
}
