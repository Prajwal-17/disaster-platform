"use client";

/**
 * LocationPicker — Embeddable mini-map for dialogs.
 * Click to place a pin, geocoding search, and "Use my location" button.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_URL, TILE_ATTRIBUTION } from "./map-config";
import { Button } from "@/components/ui/button";
import { MapPin, Locate, Search, Loader2 } from "lucide-react";

type Props = {
  /** Initial lat/lng. Falls back to center of India. */
  initialLat?: number;
  initialLng?: number;
  /** Called when user places/updates the pin */
  onChange: (lat: number, lng: number) => void;
  /** Height of the map container */
  height?: number;
};

export function LocationPicker({
  initialLat,
  initialLng,
  onChange,
  height = 240,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState(initialLat ?? 20.5937);
  const [lng, setLng] = useState(initialLng ?? 78.9629);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  // Stable onChange ref
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // ── Initialize map ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: initialLat ? 12 : 5,
      zoomControl: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Place initial marker if coordinates provided
    if (initialLat && initialLng) {
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
      });
      marker.addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        onChangeRef.current(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }

    // Click to place pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const marker = L.marker(e.latlng, { draggable: true });
        marker.addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setLat(pos.lat);
          setLng(pos.lng);
          onChangeRef.current(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }

      setLat(clickLat);
      setLng(clickLng);
      onChangeRef.current(clickLat, clickLng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Use my location ─────────────────────────────────────────────
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        onChangeRef.current(latitude, longitude);

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 0.6 });
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], {
              draggable: true,
            });
            marker.addTo(mapRef.current);
            marker.on("dragend", () => {
              const p = marker.getLatLng();
              setLat(p.lat);
              setLng(p.lng);
              onChangeRef.current(p.lat, p.lng);
            });
            markerRef.current = marker;
          }
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  // ── Geocoding search (Nominatim) ────────────────────────────────
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setSearching(true);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        );
        const data = await res.json();
        if (data.length > 0) {
          const { lat: sLat, lon: sLng } = data[0];
          const numLat = parseFloat(sLat);
          const numLng = parseFloat(sLng);

          setLat(numLat);
          setLng(numLng);
          onChangeRef.current(numLat, numLng);

          if (mapRef.current) {
            mapRef.current.flyTo([numLat, numLng], 14, { duration: 0.6 });
            if (markerRef.current) {
              markerRef.current.setLatLng([numLat, numLng]);
            } else {
              const marker = L.marker([numLat, numLng], { draggable: true });
              marker.addTo(mapRef.current);
              marker.on("dragend", () => {
                const p = marker.getLatLng();
                setLat(p.lat);
                setLng(p.lng);
                onChangeRef.current(p.lat, p.lng);
              });
              markerRef.current = marker;
            }
          }
        }
      } catch {
        // Silently fail geocoding
      }
      setSearching(false);
    },
    [searchQuery],
  );

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-9 !h-9 !text-[13px]"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={searching}
          className="h-9 px-3"
        >
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="h-9 px-3"
          title="Use my location"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Locate className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>

      {/* Map */}
      <div
        ref={containerRef}
        className="w-full rounded-xl border border-border overflow-hidden"
        style={{ height }}
      />

      {/* Coordinates display */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span className="font-medium">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
        <span className="text-muted-foreground/50">— click map to place pin</span>
      </div>
    </div>
  );
}
