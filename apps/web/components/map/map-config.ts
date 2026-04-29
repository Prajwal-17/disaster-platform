/**
 * Centralized map configuration — single source of truth for
 * tile layers, incident colors, status opacity, and legend items.
 */

// ─── Tile Layer ──────────────────────────────────────────────────────────────
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

// ─── Incident Type Colors ────────────────────────────────────────────────────
export const INCIDENT_COLORS: Record<string, string> = {
  flood: "#2563EB",      // vivid blue
  earthquake: "#DC2626",  // strong red
  cyclone: "#7C3AED",    // deep violet
  fire: "#EA580C",       // burnt orange
  other: "#64748B",      // slate
};

// ─── Incident Type Labels ────────────────────────────────────────────────────
export const INCIDENT_LABELS: Record<string, string> = {
  flood: "Flood",
  earthquake: "Earthquake",
  cyclone: "Cyclone",
  fire: "Fire",
  other: "Other",
};

// ─── Status Opacity ──────────────────────────────────────────────────────────
export const STATUS_OPACITY: Record<string, number> = {
  active: 1,
  resolved: 0.45,
  archived: 0.25,
};

// ─── SVG Icon Paths (24×24 viewBox) ──────────────────────────────────────────
// Clean, recognizable silhouettes for map markers
export const INCIDENT_ICON_PATHS: Record<string, string> = {
  flood:
    // Water droplet
    "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z",
  earthquake:
    // Zigzag seismic line
    "M2 12h3l2-4 3 8 3-8 3 8 2-4h2",
  cyclone:
    // Spiral wind
    "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2a10 10 0 0 1 7.07 2.93M12 2a10 10 0 0 0-7.07 2.93M4.93 4.93A10 10 0 0 0 2 12M19.07 4.93A10 10 0 0 1 22 12",
  fire:
    // Flame
    "M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z",
  other:
    // Alert triangle
    "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
};

// ─── Legend Items ─────────────────────────────────────────────────────────────
export const LEGEND_ITEMS = [
  { type: "flood", label: "Flood", color: INCIDENT_COLORS.flood },
  { type: "earthquake", label: "Earthquake", color: INCIDENT_COLORS.earthquake },
  { type: "cyclone", label: "Cyclone", color: INCIDENT_COLORS.cyclone },
  { type: "fire", label: "Fire", color: INCIDENT_COLORS.fire },
  { type: "other", label: "Other", color: INCIDENT_COLORS.other },
] as const;
