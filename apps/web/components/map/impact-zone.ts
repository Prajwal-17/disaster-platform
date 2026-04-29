/**
 * Enhanced impact zone rendering for the map.
 * Creates concentric circles with gradient-like fill to show disaster radius.
 */
import L from "leaflet";
import { INCIDENT_COLORS } from "./map-config";

/**
 * Render a multi-layer impact zone circle for an incident.
 * Returns an array of L.Circle layers (inner core + outer ring).
 */
export function createImpactZone(
  lat: number,
  lng: number,
  radiusKm: number,
  type: string,
  opts: { interactive?: boolean } = {},
): L.Circle[] {
  const color = INCIDENT_COLORS[type] || INCIDENT_COLORS.other;
  const radiusMeters = radiusKm * 1000;

  // Inner core — higher opacity, shows the danger center
  const innerCore = L.circle([lat, lng], {
    radius: radiusMeters * 0.4,
    fillColor: color,
    fillOpacity: 0.12,
    color: color,
    weight: 0,
    interactive: opts.interactive ?? true,
  });

  // Mid ring — medium opacity
  const midRing = L.circle([lat, lng], {
    radius: radiusMeters * 0.7,
    fillColor: color,
    fillOpacity: 0.06,
    color: color,
    weight: 0,
    interactive: false,
  });

  // Outer ring — subtle boundary with styled border
  const outerRing = L.circle([lat, lng], {
    radius: radiusMeters,
    fillColor: color,
    fillOpacity: 0.03,
    color: color,
    weight: 1.5,
    opacity: 0.3,
    interactive: opts.interactive ?? true,
  });

  return [outerRing, midRing, innerCore];
}
