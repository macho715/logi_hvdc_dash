import { GeoJsonLayer } from "@deck.gl/layers"
import type { Location } from "@/types/logistics"

// Generate simple polygon geofences around locations
function generateGeofencePolygons(locations: Location[]) {
  return {
    type: "FeatureCollection" as const,
    features: locations.map((loc) => {
      // Create a simple square geofence around each location
      const offset = 0.02 // ~2km offset
      return {
        type: "Feature" as const,
        properties: {
          location_id: loc.location_id,
          name: loc.name,
          siteType: loc.siteType,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [loc.lon - offset, loc.lat - offset],
              [loc.lon + offset, loc.lat - offset],
              [loc.lon + offset, loc.lat + offset],
              [loc.lon - offset, loc.lat + offset],
              [loc.lon - offset, loc.lat - offset],
            ],
          ],
        },
      }
    }),
  }
}

export function createGeofenceLayer(locations: Location[], visible = true) {
  const geojson = generateGeofencePolygons(locations)

  return new GeoJsonLayer({
    id: "geofence-layer",
    data: geojson,
    visible,
    pickable: false,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 2,
    getFillColor: [100, 150, 255, 40],
    getLineColor: [100, 150, 255, 150],
    getLineWidth: 2,
  })
}
