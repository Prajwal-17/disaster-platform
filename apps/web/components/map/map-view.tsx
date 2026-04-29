"use client";

/**
 * MapView — The main Leaflet map with custom markers, impact zones,
 * and rich popups. Uses modular helpers from map-config, map-markers,
 * impact-zone, and map-popup.
 */
import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident, ResourceRequest } from "@/lib/api";
import { TILE_URL, TILE_ATTRIBUTION, STATUS_OPACITY } from "./map-config";
import { createIncidentMarker } from "./map-markers";
import { createImpactZone } from "./impact-zone";
import { buildPopupHTML } from "./map-popup";
import { MapLegend } from "./map-legend";

// Fix default marker icon issue in Next.js/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapViewProps = {
  incidents: Incident[];
  center: [number, number];
  zoom: number;
  selectedIncidentId?: string | null;
  /** Per-incident requests for rich popups (optional) */
  requestsByIncident?: Record<string, ResourceRequest[]>;
  onIncidentClick?: (incident: Incident) => void;
  onMapMove?: (center: [number, number], zoom: number) => void;
  className?: string;
};

export function MapView({
  incidents,
  center,
  zoom,
  selectedIncidentId,
  requestsByIncident,
  onIncidentClick,
  onMapMove,
  className = "",
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Stable callback ref for onMapMove
  const onMapMoveRef = useRef(onMapMove);
  onMapMoveRef.current = onMapMove;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // Voyager tiles — warmer, modern, great for data overlays
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      onMapMoveRef.current?.([c.lat, c.lng], map.getZoom());
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when incidents change
  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;
    markersRef.current.clearLayers();

    incidents.forEach((incident) => {
      const opacity = STATUS_OPACITY[incident.status] || 1;
      const isSelected = incident.id === selectedIncidentId;

      // ── Impact zone circles (active incidents only) ──────────────
      if (incident.status === "active") {
        const zones = createImpactZone(
          incident.lat,
          incident.lng,
          incident.radiusKm,
          incident.type,
          { interactive: true },
        );
        zones.forEach((zone) => {
          zone.on("click", () => onIncidentClick?.(incident));
          zone.setStyle({ fillOpacity: zone.options.fillOpacity! * opacity });
          markersRef.current!.addLayer(zone);
        });
      }

      // ── Custom SVG marker ──────────────────────────────────────
      const icon = createIncidentMarker(incident.type, {
        selected: isSelected,
        status: incident.status,
      });

      const marker = L.marker([incident.lat, incident.lng], {
        icon,
        opacity,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      // Rich popup
      const requests = requestsByIncident?.[incident.id];
      const popupHTML = buildPopupHTML(incident, requests);
      marker.bindPopup(popupHTML, {
        maxWidth: 300,
        minWidth: 220,
        className: "incident-popup",
        closeButton: true,
      });

      // Tooltip on hover (quick glance)
      marker.bindTooltip(
        `<div style="font-family:'Geist',ui-sans-serif,system-ui,sans-serif;padding:2px 0;">
          <strong style="font-size:13px;font-weight:600;color:#1e293b;">${incident.title}</strong>
        </div>`,
        { direction: "top", offset: [0, -24] },
      );

      marker.on("click", () => onIncidentClick?.(incident));
      markersRef.current!.addLayer(marker);
    });
  }, [incidents, selectedIncidentId, onIncidentClick, requestsByIncident]);

  // Fly to selected incident
  useEffect(() => {
    if (!mapRef.current || !selectedIncidentId) return;
    const incident = incidents.find((i) => i.id === selectedIncidentId);
    if (incident) {
      mapRef.current.flyTo([incident.lat, incident.lng], 12, {
        duration: 0.8,
      });
    }
  }, [selectedIncidentId, incidents]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: "300px" }}
      />
      <MapLegend />
    </div>
  );
}
