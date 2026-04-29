"use client";

import { CreateRequestDialog } from "@/components/requests/create-request-dialog";
import { RequestCard } from "@/components/requests/request-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncident, useRequests } from "@/lib/queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Droplets,
  Flame,
  HelpCircle,
  MapPin,
  Mountain,
  Users,
  Wind,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-full w-full animate-pulse" />,
  },
);

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  flood: {
    icon: Droplets,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Flood",
  },
  earthquake: {
    icon: Mountain,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Earthquake",
  },
  cyclone: {
    icon: Wind,
    color: "text-violet-600",
    bg: "bg-violet-50",
    label: "Cyclone",
  },
  fire: {
    icon: Flame,
    color: "text-orange-600",
    bg: "bg-orange-50",
    label: "Fire",
  },
  other: {
    icon: HelpCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
    label: "Other",
  },
};

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: incidentData, isLoading: incLoading } = useIncident(id);
  const { data: requests = [], isLoading: reqLoading } = useRequests(id);

  const incident = incidentData?.incident;

  const filteredRequests = requests.filter((r) => {
    if (urgencyFilter !== "all" && r.urgency !== urgencyFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const config = (
    incident
      ? TYPE_CONFIG[incident.type] || TYPE_CONFIG.other
      : TYPE_CONFIG.other
  )!;
  const Icon = config.icon;

  const canPostRequest =
    user?.role === "volunteer" ||
    user?.role === "ngo" ||
    user?.role === "admin";

  if (incLoading) {
    return (
      <div className="flex h-full">
        <div className="flex-1 bg-muted animate-pulse" />
        <div className="w-96 border-l p-4 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Incident not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Map */}
      <div className="relative min-w-0 flex-1">
        <MapView
          incidents={[incident]}
          center={[incident.lat, incident.lng]}
          zoom={12}
          selectedIncidentId={incident.id}
        />
      </div>

      <aside className="flex w-[420px] shrink-0 flex-col border-l bg-white">
        <div className="shrink-0 border-b px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold">
                {incident.title}
              </h1>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <div
              className={cn(
                "flex items-center gap-1 font-medium",
                config.color,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </div>
            <span>·</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] uppercase",
                incident.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600",
              )}
            >
              {incident.status}
            </Badge>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {incident.lat.toFixed(2)}, {incident.lng.toFixed(2)}
            </span>
            <span>·</span>
            <span>{incident.radiusKm} km radius</span>
          </div>

          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
            {incident.description}
          </p>
        </div>

        {/* Request filters + create */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-7 w-auto text-xs">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 w-auto text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blood">Blood</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="rescue">Rescue</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="shelter">Shelter</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canPostRequest && (
            <CreateRequestDialog
              incidentId={id}
              incidentLat={incident.lat}
              incidentLng={incident.lng}
            />
          )}
        </div>

        {/* Request list */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              {reqLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-md" />
                ))
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="text-muted-foreground/40 mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-sm font-medium">
                    No resource requests yet
                  </p>
                  <p className="text-muted-foreground/60 mt-1 text-xs">
                    {canPostRequest
                      ? "Post the first request to coordinate resources"
                      : "Check back soon for updates"}
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t px-4 py-2">
          <span className="text-muted-foreground text-xs">
            {filteredRequests.length} request
            {filteredRequests.length !== 1 ? "s" : ""}
          </span>
        </div>
      </aside>
    </div>
  );
}
