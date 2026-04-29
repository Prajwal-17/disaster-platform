"use client";

/**
 * Incident filters — enhanced with icons, clear button, and pill toggles.
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/stores/map-store";
import { cn } from "@/lib/utils";
import {
  Droplets,
  Mountain,
  Wind,
  Flame,
  HelpCircle,
  X,
  CheckCircle,
  Radio,
  Layers,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types", icon: Layers },
  { value: "flood", label: "Flood", icon: Droplets },
  { value: "earthquake", label: "Earthquake", icon: Mountain },
  { value: "cyclone", label: "Cyclone", icon: Wind },
  { value: "fire", label: "Fire", icon: Flame },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", icon: Layers },
  { value: "active", label: "Active", icon: Radio },
  { value: "resolved", label: "Resolved", icon: CheckCircle },
] as const;

export function IncidentFilters({ className }: { className?: string }) {
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);

  const hasActiveFilters =
    filters.status !== "active" || filters.type !== "all";

  const clearFilters = () => {
    setFilters({ status: "active", type: "all" });
  };

  return (
    <div className={cn("flex items-center gap-2 border-b border-[#E2E8F0] px-4 py-3", className)}>
      <Select
        value={filters.status}
        onValueChange={(v) =>
          setFilters({ status: v as "all" | "active" | "resolved" })
        }
      >
        <SelectTrigger className="h-8 w-auto rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)] text-[12px] font-medium">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type}
        onValueChange={(v) =>
          setFilters({
            type: v as
              | "all"
              | "flood"
              | "earthquake"
              | "cyclone"
              | "fire"
              | "other",
          })
        }
      >
        <SelectTrigger className="h-8 w-auto rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)] text-[12px] font-medium">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 gap-1 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
