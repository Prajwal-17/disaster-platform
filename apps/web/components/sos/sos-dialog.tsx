"use client";

/**
 * SOS Help Request Dialog — streamlined form for victims.
 * Quick-select chips for resource type, auto-detects location,
 * auto-selects nearest active incident.
 */
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useCreateRequest } from "@/lib/queries";
import type { Incident } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Droplet,
  Pill,
  LifeBuoy,
  Utensils,
  Home,
  Package,
  MapPin,
  AlertTriangle,
} from "lucide-react";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-[180px] w-full rounded-xl bg-muted animate-pulse" /> },
);

const RESOURCE_CHIPS = [
  { value: "blood", label: "Blood", icon: Droplet, emoji: "🩸" },
  { value: "medicine", label: "Medicine", icon: Pill, emoji: "💊" },
  { value: "rescue", label: "Rescue", icon: LifeBuoy, emoji: "🚁" },
  { value: "food", label: "Food", icon: Utensils, emoji: "🍞" },
  { value: "shelter", label: "Shelter", icon: Home, emoji: "🏠" },
  { value: "other", label: "Other", icon: Package, emoji: "📦" },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidents: Incident[];
};

/**
 * Find the nearest active incident to a given lat/lng.
 */
function findNearestIncident(
  incidents: Incident[],
  lat: number,
  lng: number,
): Incident | null {
  const active = incidents.filter((i) => i.status === "active");
  if (active.length === 0) return null;

  let nearest = active[0];
  let minDist = Infinity;

  for (const inc of active) {
    const d = Math.sqrt(
      Math.pow(inc.lat - lat, 2) + Math.pow(inc.lng - lng, 2),
    );
    if (d < minDist) {
      minDist = d;
      nearest = inc;
    }
  }

  return nearest!;
}

export function SOSDialog({ open, onOpenChange, incidents }: Props) {
  const [type, setType] = useState("rescue");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [nearestIncident, setNearestIncident] = useState<Incident | null>(null);

  // We'll use createRequest once we know the incident
  const incidentId = nearestIncident?.id ?? "";
  const createReq = useCreateRequest(incidentId);

  const handleLocationChange = useCallback(
    (newLat: number, newLng: number) => {
      setLat(newLat);
      setLng(newLng);
      const nearest = findNearestIncident(incidents, newLat, newLng);
      setNearestIncident(nearest);
    },
    [incidents],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nearestIncident) {
      toast.error("No active incidents found nearby. Please contact local authorities.");
      return;
    }

    if (lat === null || lng === null) {
      toast.error("Please select your location on the map.");
      return;
    }

    const title = `SOS: Need ${RESOURCE_CHIPS.find((c) => c.value === type)?.label || "Help"}`;

    createReq.mutate(
      {
        title,
        description: description || `Emergency ${type} request from field`,
        type,
        lat,
        lng,
        urgency: "critical",
        maxVolunteers: 5,
      },
      {
        onSuccess: () => {
          toast.success("Help request sent! Volunteers will be notified.");
          onOpenChange(false);
          resetForm();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to send help request");
        },
      },
    );
  };

  const resetForm = () => {
    setType("rescue");
    setDescription("");
    setLat(null);
    setLng(null);
    setNearestIncident(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            Request Emergency Help
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Resource type chips */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground/80">
              What do you need?
            </Label>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setType(chip.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
                    type === chip.value
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <span>{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground/80">
              Details <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <textarea
              placeholder="Describe your situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="textarea-field w-full"
            />
          </div>

          {/* Location picker */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground/80">
              Your Location
            </Label>
            <LocationPicker
              onChange={handleLocationChange}
              height={180}
            />
          </div>

          {/* Nearest incident indicator */}
          {nearestIncident ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span className="text-[12px] text-green-800">
                Linking to:{" "}
                <strong className="font-semibold">
                  {nearestIncident.title}
                </strong>
              </span>
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] font-semibold bg-green-100 text-green-700 border-0"
              >
                {nearestIncident.type}
              </Badge>
            </div>
          ) : lat !== null ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[12px] text-amber-800">
                No active incidents nearby. Your request may not be visible to volunteers.
              </span>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReq.isPending || !nearestIncident}
              className="h-10 px-5 text-[13px] font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {createReq.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send SOS
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
