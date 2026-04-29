"use client";

import { useState } from "react";
import { useCreateRequest } from "@/lib/queries";
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
  const [lat, setLat] = useState(String(incidentLat));
  const [lng, setLng] = useState(String(incidentLng));
  const [maxVolunteers, setMaxVolunteers] = useState("10");

  const createReq = useCreateRequest(incidentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createReq.mutate(
      {
        title,
        description,
        type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
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
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("food");
    setUrgency("medium");
    setLat(String(incidentLat));
    setLng(String(incidentLng));
    setMaxVolunteers("10");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-7 text-[12px] font-semibold">
          <Plus className="h-3.5 w-3.5" />
          Post Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Post Resource Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground/80">Title</Label>
            <input
              placeholder="e.g. Need 5 units O+ blood"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground/80">Description</Label>
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
              <Label className="text-[13px] font-medium text-foreground/80">Resource Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood">Blood</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="rescue">Rescue</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground/80">Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="h-11 rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground/80">Latitude</Label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground/80">Longitude</Label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground/80">Max Vol.</Label>
              <input
                type="number"
                value={maxVolunteers}
                onChange={(e) => setMaxVolunteers(e.target.value)}
                min={1}
                max={100}
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
