"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Incident } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Clock,
  Droplets,
  Flame,
  HelpCircle,
  MapPin,
  Mountain,
  Wind,
} from "lucide-react";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; badgeClass: string }
> = {
  flood: {
    icon: Droplets,
    color: "text-[oklch(0.45_0.16_250)]",
    bg: "bg-[oklch(0.94_0.04_250)]",
    badgeClass: "badge-flood",
  },
  earthquake: {
    icon: Mountain,
    color: "text-[oklch(0.48_0.14_25)]",
    bg: "bg-[oklch(0.95_0.03_25)]",
    badgeClass: "badge-earthquake",
  },
  cyclone: {
    icon: Wind,
    color: "text-[oklch(0.48_0.16_290)]",
    bg: "bg-[oklch(0.95_0.03_290)]",
    badgeClass: "badge-cyclone",
  },
  fire: {
    icon: Flame,
    color: "text-[oklch(0.52_0.18_40)]",
    bg: "bg-[oklch(0.95_0.04_50)]",
    badgeClass: "badge-fire",
  },
  other: {
    icon: HelpCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    badgeClass: "badge-other",
  },
};

const STATUS_BADGE: Record<string, string> = {
  active: "badge-active",
  resolved: "badge-resolved",
  archived: "badge-archived",
};

type Props = {
  incidents: Incident[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (incident: Incident) => void;
};

export function IncidentList({
  incidents,
  isLoading,
  selectedId,
  onSelect,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
          <MapPin className="text-muted-foreground/50 h-5 w-5" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          No incidents found
        </p>
        <p className="text-muted-foreground/60 mt-1 text-xs">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ScrollArea className="absolute inset-0">
        <div className="space-y-1 p-2">
          {incidents.map((incident) => {
            const config = (TYPE_CONFIG[incident.type] || TYPE_CONFIG.other)!;
            const Icon = config.icon;
            const isSelected = incident.id === selectedId;
            const timeAgo = getTimeAgo(incident.createdAt);

            return (
              <button
                key={incident.id}
                onClick={() => onSelect(incident)}
                className={cn(
                  "incident-card flex w-full items-start gap-3 text-left",
                  isSelected && "selected",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    config.bg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground truncate text-[13px] leading-tight font-semibold">
                      {incident.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 border-0 text-[10px] font-semibold tracking-wider uppercase",
                        STATUS_BADGE[incident.status],
                      )}
                    >
                      {incident.status}
                    </Badge>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                        config.badgeClass,
                      )}
                    >
                      {incident.type}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
