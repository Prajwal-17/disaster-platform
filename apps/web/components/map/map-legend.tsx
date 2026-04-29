"use client";

/**
 * Map Legend overlay — shows incident type colors and labels.
 * Positioned bottom-left of the map container.
 */
import { LEGEND_ITEMS } from "./map-config";

export function MapLegend() {
  return (
    <div className="absolute bottom-20 left-3 z-[1000] rounded-xl border border-border/60 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        Incident Types
      </p>
      <div className="space-y-1">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] font-medium text-foreground/80">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
