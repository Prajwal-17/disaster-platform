"use client";

import type { Incident } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Droplets,
  Mountain,
  Wind,
  Flame,
  HelpCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  flood: { icon: Droplets, color: "text-blue-600", bg: "bg-blue-50" },
  earthquake: { icon: Mountain, color: "text-red-600", bg: "bg-red-50" },
  cyclone: { icon: Wind, color: "text-violet-600", bg: "bg-violet-50" },
  fire: { icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
  other: { icon: HelpCircle, color: "text-gray-600", bg: "bg-gray-50" },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  resolved: "bg-gray-100 text-gray-600",
  archived: "bg-gray-100 text-gray-400",
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
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <MapPin className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No incidents found
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
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
                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "bg-primary/5 ring-1 ring-primary/20"
                  : "hover:bg-muted/60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded",
                  config.bg
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {incident.title}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase",
                      STATUS_STYLES[incident.status]
                    )}
                  >
                    {incident.status}
                  </Badge>
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("font-medium uppercase", config.color)}>
                    {incident.type}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
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
