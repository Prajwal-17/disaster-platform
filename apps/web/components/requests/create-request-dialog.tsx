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
import { useCreateRequest } from "@/lib/queries";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Droplet,
  Home,
  Info,
  LifeBuoy,
  Loader2,
  Package,
  Pill,
  Plus,
  Utensils,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-[200px] w-full animate-pulse rounded-xl" />
    ),
  },
);

const RESOURCE_OPTIONS = [
  { value: "blood", label: "Blood", icon: Droplet },
  { value: "medicine", label: "Medicine", icon: Pill },
  { value: "rescue", label: "Rescue", icon: LifeBuoy },
  { value: "food", label: "Food", icon: Utensils },
  { value: "shelter", label: "Shelter", icon: Home },
  { value: "other", label: "Other", icon: Package },
] as const;

const URGENCY_OPTIONS = [
  { value: "critical", label: "Critical", icon: AlertTriangle },
  { value: "high", label: "High", icon: AlertCircle },
  { value: "medium", label: "Medium", icon: Info },
  { value: "low", label: "Low", icon: CheckCircle },
] as const;

type Props = {
  incidentId: string;
  incidentLat: number;
  incidentLng: number;
};

export function CreateRequestDialog({
  incidentId,
  incidentLat,
  incidentLng,
}: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("food");
  const [urgency, setUrgency] = useState("medium");
  const [lat, setLat] = useState(incidentLat);
  const [lng, setLng] = useState(incidentLng);
  const [maxVolunteers, setMaxVolunteers] = useState("10");

  const createReq = useCreateRequest(incidentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createReq.mutate(
      {
        title,
        description,
        type,
        lat,
        lng,
        urgency,
        maxVolunteers: parseInt(maxVolunteers, 10),
      },
      {
        onSuccess: () => {
          toast.success("Resource request posted");
          setOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create request");
        },
      },
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("food");
    setUrgency("medium");
    setLat(incidentLat);
    setLng(incidentLng);
    setMaxVolunteers("10");
  };

  const SelectedResourceIcon =
    RESOURCE_OPTIONS.find((r) => r.value === type)?.icon || Package;
  const SelectedUrgencyIcon =
    URGENCY_OPTIONS.find((u) => u.value === urgency)?.icon || Info;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1.5 text-[12px] font-semibold">
          <Plus className="h-3.5 w-3.5" />
          Post Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Post Resource Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-1 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Title
            </Label>
            <input
              placeholder="e.g. Need 5 units O+ blood"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Description
            </Label>
            <textarea
              placeholder="Provide details about the request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={2}
              className="textarea-field w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground/80 text-[13px] font-medium">
                Resource Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80 text-[13px] font-medium">
                Urgency
              </Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Max Volunteers
            </Label>
            <input
              type="number"
              value={maxVolunteers}
              onChange={(e) => setMaxVolunteers(e.target.value)}
              min={1}
              max={100}
              className="input-field w-full"
            />
          </div>

          {/* Map-based location picker */}
          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Location
            </Label>
            <LocationPicker
              initialLat={incidentLat}
              initialLng={incidentLng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              height={180}
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
              disabled={createReq.isPending}
              className="h-10 px-5 text-[13px] font-semibold"
            >
              {createReq.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
