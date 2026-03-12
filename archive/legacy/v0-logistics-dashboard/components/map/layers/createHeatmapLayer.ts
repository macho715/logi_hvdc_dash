import { HeatmapLayer } from "@deck.gl/aggregation-layers"
import type { Event } from "@/types/logistics"

export function createHeatmapLayer(events: Event[], visible = true) {
  return new HeatmapLayer<Event>({
    id: "heatmap-layer",
    data: events,
    visible,
    pickable: false,
    getPosition: (d) => [d.lon, d.lat],
    getWeight: 1,
    radiusPixels: 60,
    intensity: 1,
    threshold: 0.03,
    colorRange: [
      [1, 152, 189, 25],
      [73, 227, 206, 100],
      [216, 254, 181, 150],
      [254, 237, 177, 180],
      [254, 173, 84, 200],
      [209, 55, 78, 230],
    ],
  })
}
