"use client";

/**
 * Map Legend overlay — shows incident type colors and labels.
 * Positioned bottom-left of the map container.
 */
import { LEGEND_ITEMS } from "./map-config";

export function MapLegend() {
  return (
    <div className="absolute top-6 left-6 z-[1000] rounded-2xl border border-border/40 bg-background/95 px-4 py-4 shadow-xl backdrop-blur-md min-w-[160px]">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
