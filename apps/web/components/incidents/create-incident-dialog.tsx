"use client";

import { useState } from "react";
import { useCreateIncident } from "@/lib/queries";
import { useMapStore } from "@/lib/stores/map-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function CreateIncidentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("flood");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("10");
  const center = useMapStore((s) => s.center);

  const createIncident = useCreateIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(lat) || center[0];
    const lngNum = parseFloat(lng) || center[1];

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
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("flood");
    setLat("");
    setLng("");
    setRadiusKm("10");
  };

  const useCurrentMapCenter = () => {
    setLat(String(center[0].toFixed(4)));
    setLng(String(center[1].toFixed(4)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-7 text-[12px] font-semibold">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Report New Incident
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          <div className="space-y-2">
            <Label htmlFor="inc-title" className="text-[13px] font-medium text-foreground/80">
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
            <Label htmlFor="inc-desc" className="text-[13px] font-medium text-foreground/80">
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
              <Label className="text-[13px] font-medium text-foreground/80">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="cyclone">Cyclone</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground/80">Radius (km)</Label>
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
            <div className="flex items-center justify-between">
              <Label className="text-[13px] font-medium text-foreground/80">Location</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary font-medium hover:text-primary/80"
                onClick={useCurrentMapCenter}
              >
                Use map center
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="input-field w-full"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>
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
