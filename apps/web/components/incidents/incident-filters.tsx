"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapStore } from "@/lib/stores/map-store";

export function IncidentFilters() {
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b">
      <Select
        value={filters.status}
        onValueChange={(v) =>
          setFilters({ status: v as "all" | "active" | "resolved" })
        }
      >
        <SelectTrigger className="h-8 w-auto text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
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
        <SelectTrigger className="h-8 w-auto text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="flood">Flood</SelectItem>
          <SelectItem value="earthquake">Earthquake</SelectItem>
          <SelectItem value="cyclone">Cyclone</SelectItem>
          <SelectItem value="fire">Fire</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
