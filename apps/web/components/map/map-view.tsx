"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident } from "@/lib/api";

// Fix default marker icon issue in Next.js/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INCIDENT_COLORS: Record<string, string> = {
  flood: "#3b82f6",
  earthquake: "#ef4444",
  cyclone: "#8b5cf6",
  fire: "#f97316",
  other: "#6b7280",
};

const STATUS_OPACITY: Record<string, number> = {
  active: 1,
  resolved: 0.5,
  archived: 0.3,
};

type MapViewProps = {
  incidents: Incident[];
  center: [number, number];
  zoom: number;
  selectedIncidentId?: string | null;
  onIncidentClick?: (incident: Incident) => void;
  onMapMove?: (center: [number, number], zoom: number) => void;
  className?: string;
};

export function MapView({
  incidents,
  center,
  zoom,
  selectedIncidentId,
  onIncidentClick,
  onMapMove,
  className = "",
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // Clean light tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      onMapMove?.([c.lat, c.lng], map.getZoom());
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
      const color = INCIDENT_COLORS[incident.type] || INCIDENT_COLORS.other;
      const opacity = STATUS_OPACITY[incident.status] || 1;
      const isSelected = incident.id === selectedIncidentId;

      const marker = L.circleMarker([incident.lat, incident.lng], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? "#1e293b" : color,
        weight: isSelected ? 3 : 2,
        fillOpacity: opacity * 0.7,
        opacity: opacity,
      });

      // Tooltip
      marker.bindTooltip(
        `<div style="font-family: 'DM Sans', sans-serif; padding: 2px 0;">
          <strong style="font-size: 13px;">${incident.title}</strong><br/>
          <span style="font-size: 11px; text-transform: uppercase; color: ${color}; font-weight: 600;">${incident.type}</span>
          <span style="font-size: 11px; color: #64748b; margin-left: 6px;">${incident.status}</span>
        </div>`,
        { direction: "top", offset: [0, -8] }
      );

      marker.on("click", () => onIncidentClick?.(incident));
      markersRef.current!.addLayer(marker);

      // Draw radius circle for active incidents
      if (incident.status === "active") {
        const radiusCircle = L.circle([incident.lat, incident.lng], {
          radius: incident.radiusKm * 1000,
          fillColor: color,
          fillOpacity: 0.04,
          color: color,
          weight: 1,
          opacity: 0.2,
          dashArray: "4 4",
        });
        markersRef.current!.addLayer(radiusCircle);
      }
    });
  }, [incidents, selectedIncidentId, onIncidentClick]);

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
    <div
      ref={containerRef}
      className={`h-full w-full ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
}
