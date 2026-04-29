/**
 * Custom Leaflet DivIcon markers with inline SVG icons.
 * Each incident type gets a distinct icon inside a colored circle.
 */
import L from "leaflet";
import { INCIDENT_COLORS, INCIDENT_ICON_PATHS } from "./map-config";

/**
 * Create a DivIcon with an SVG icon for the given incident type.
 * Optionally highlights (larger + ring) when selected.
 */
export function createIncidentMarker(
  type: string,
  opts: { selected?: boolean; status?: string } = {},
): L.DivIcon {
  const color = INCIDENT_COLORS[type] || INCIDENT_COLORS.other;
  const iconPath = INCIDENT_ICON_PATHS[type] || INCIDENT_ICON_PATHS.other;
  const isActive = opts.status === "active";
  const isSelected = opts.selected ?? false;

  const size = isSelected ? 44 : 36;
  const half = size / 2;
  const iconSize = isSelected ? 18 : 14;

  // Pulse ring for active incidents
  const pulseRing = isActive
    ? `<circle cx="${half}" cy="${half}" r="${half - 2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.4">
        <animate attributeName="r" from="${half - 2}" to="${half + 8}" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>`
    : "";

  // Selection ring
  const selRing = isSelected
    ? `<circle cx="${half}" cy="${half}" r="${half - 1}" fill="none" stroke="#1e293b" stroke-width="2.5" opacity="0.8"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size + 20}" height="${size + 20}" viewBox="0 0 ${size + 20} ${size + 20}">
      ${pulseRing ? `<g transform="translate(10,10)">${pulseRing}</g>` : ""}
      <g transform="translate(10,10)">
        ${selRing}
        <circle cx="${half}" cy="${half}" r="${half - 2}" fill="${color}" opacity="0.92"/>
        <circle cx="${half}" cy="${half}" r="${half - 3}" fill="${color}" stroke="white" stroke-width="1.5"/>
        <g transform="translate(${(size - iconSize) / 2}, ${(size - iconSize) / 2})">
          <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${iconPath}"/>
          </svg>
        </g>
      </g>
    </svg>
  `;

  const totalSize = size + 20;

  return L.divIcon({
    html: svg,
    className: "incident-marker-icon",
    iconSize: [totalSize, totalSize],
    iconAnchor: [totalSize / 2, totalSize / 2],
    popupAnchor: [0, -(totalSize / 2)],
  });
}
