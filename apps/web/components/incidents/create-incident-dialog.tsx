"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateIncident } from "@/lib/queries";
import { useMapStore } from "@/lib/stores/map-store";
import {
  Droplets,
  Flame,
  HelpCircle,
  Loader2,
  Mountain,
  Plus,
  Wind,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
  () =>
    import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-[240px] w-full animate-pulse rounded-xl" />
    ),
  },
);

const TYPE_OPTIONS = [
  { value: "flood", label: "Flood", icon: Droplets },
  { value: "earthquake", label: "Earthquake", icon: Mountain },
  { value: "cyclone", label: "Cyclone", icon: Wind },
  { value: "fire", label: "Fire", icon: Flame },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

export function CreateIncidentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("flood");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState("10");
  const center = useMapStore((s) => s.center);

  const createIncident = useCreateIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = lat ?? center[0];
    const lngNum = lng ?? center[1];

    createIncident.mutate(
      {
        title,
        description,
        type,
        lat: latNum,
        lng: lngNum,
        radius_km: parseFloat(radiusKm) || 10,
      },
      {
        onSuccess: () => {
          toast.success("Incident created successfully");
          setOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create incident");
        },
      },
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("flood");
    setLat(null);
    setLng(null);
    setRadiusKm("10");
  };

  const SelectedIcon =
    TYPE_OPTIONS.find((t) => t.value === type)?.icon || HelpCircle;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1.5 text-[12px] font-semibold">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Report New Incident
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-1 space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="inc-title"
              className="text-foreground/80 text-[13px] font-medium"
            >
              Title
            </Label>
            <input
              id="inc-title"
              placeholder="e.g. Chennai Flood 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="inc-desc"
              className="text-foreground/80 text-[13px] font-medium"
            >
              Description
            </Label>
            <textarea
              id="inc-desc"
              placeholder="Describe the disaster situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="textarea-field w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground/80 text-[13px] font-medium">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="text-muted-foreground h-3.5 w-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">{label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80 text-[13px] font-medium">
                Radius (km)
              </Label>
              <input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                min={1}
                max={100}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Location
            </Label>
            <LocationPicker
              initialLat={center[0]}
              initialLng={center[1]}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              height={200}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createIncident.isPending}
              className="h-10 px-5 text-[13px] font-semibold"
            >
              {createIncident.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
