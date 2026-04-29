"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useIncident, useRequests } from "@/lib/queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { RequestCard } from "@/components/requests/request-card";
import { CreateRequestDialog } from "@/components/requests/create-request-dialog";
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
import {
  ArrowLeft,
  Droplets,
  Mountain,
  Wind,
  Flame,
  HelpCircle,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string; badgeClass: string }
> = {
  flood: {
    icon: Droplets,
    color: "text-[oklch(0.45_0.16_250)]",
    bg: "bg-[oklch(0.94_0.04_250)]",
    label: "Flood",
    badgeClass: "badge-flood",
  },
  earthquake: {
    icon: Mountain,
    color: "text-[oklch(0.48_0.14_25)]",
    bg: "bg-[oklch(0.95_0.03_25)]",
    label: "Earthquake",
    badgeClass: "badge-earthquake",
  },
  cyclone: {
    icon: Wind,
    color: "text-[oklch(0.48_0.16_290)]",
    bg: "bg-[oklch(0.95_0.03_290)]",
    label: "Cyclone",
    badgeClass: "badge-cyclone",
  },
  fire: {
    icon: Flame,
    color: "text-[oklch(0.52_0.18_40)]",
    bg: "bg-[oklch(0.95_0.04_50)]",
    label: "Fire",
    badgeClass: "badge-fire",
  },
  other: {
    icon: HelpCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "Other",
    badgeClass: "badge-other",
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

  const config = (incident
    ? TYPE_CONFIG[incident.type] || TYPE_CONFIG.other
    : TYPE_CONFIG.other)!;
  const Icon = config.icon;

  const canPostRequest =
    user?.role === "volunteer" || user?.role === "ngo" || user?.role === "admin";

  if (incLoading) {
    return (
      <div className="flex h-full">
        <div className="w-[420px] border-r border-[#E2E8F0] p-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-muted animate-pulse" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Incident not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The incident may have been removed or doesn&apos;t exist.
          </p>
          <Button
            variant="outline"
            className="mt-4 h-10"
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
      {/* Left panel — Incident info + requests */}
      <aside className="sidebar-panel flex w-[420px] shrink-0 flex-col">
        {/* Header */}
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate tracking-tight text-foreground">
                {incident.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            <div className={cn("flex items-center gap-1 font-semibold", config.color)}>
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </div>
            <span className="text-muted-foreground/30">·</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider border-0",
                incident.status === "active"
                  ? "badge-active"
                  : incident.status === "resolved"
                    ? "badge-resolved"
                    : "badge-archived"
              )}
            >
              {incident.status}
            </Badge>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1 text-muted-foreground font-medium">
              <MapPin className="h-3 w-3" />
              {incident.lat.toFixed(2)}, {incident.lng.toFixed(2)}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-muted-foreground font-medium">{incident.radiusKm} km</span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {incident.description}
          </p>
        </div>

        {/* Request filters + create */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3">
          <div className="flex items-center gap-2">
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-7 w-auto text-[11px] font-medium rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
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
              <SelectTrigger className="h-7 w-auto text-[11px] font-medium rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)]">
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
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {reqLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                  <Users className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No resource requests yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
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

        <div className="border-t border-[#E2E8F0] px-5 py-2.5">
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
            {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
          </span>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1">
        <MapView
          incidents={[incident]}
          center={[incident.lat, incident.lng]}
          zoom={12}
          selectedIncidentId={incident.id}
        />
      </div>
    </div>
  );
}
