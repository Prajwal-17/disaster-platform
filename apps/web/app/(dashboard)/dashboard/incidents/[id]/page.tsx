"use client";

import { IncidentChat } from "@/components/chat/incident-chat";
import { AIChat } from "@/components/chat/ai-chat";
import { AISummary } from "@/components/chat/ai-summary";

import { CreateRequestDialog } from "@/components/requests/create-request-dialog";
import { RequestCard } from "@/components/requests/request-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncident, useRequests } from "@/lib/queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useIncidentChat } from "@/lib/hooks/use-incident-chat";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Droplet,
  Droplets,
  Filter,
  Flame,
  HelpCircle,
  Home,
  Info,
  Layers,
  LifeBuoy,
  MapPin,
  Mountain,
  Package,
  Pill,
  Users,
  Utensils,
  Wind,
  ChevronUp,
  List,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-full w-full animate-pulse" />,
  },
);

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
    badgeClass: string;
  }
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

const URGENCY_FILTER_OPTIONS = [
  { value: "all", label: "All Urgency", icon: Filter },
  { value: "critical", label: "Critical", icon: AlertTriangle },
  { value: "high", label: "High", icon: AlertCircle },
  { value: "medium", label: "Medium", icon: Info },
  { value: "low", label: "Low", icon: CheckCircle },
] as const;

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types", icon: Layers },
  { value: "blood", label: "Blood", icon: Droplet },
  { value: "medicine", label: "Medicine", icon: Pill },
  { value: "rescue", label: "Rescue", icon: LifeBuoy },
  { value: "food", label: "Food", icon: Utensils },
  { value: "shelter", label: "Shelter", icon: Home },
  { value: "other", label: "Other", icon: Package },
] as const;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: incidentData, isLoading: incLoading } = useIncident(id);
  const { data: requests = [], isLoading: reqLoading } = useRequests(id);

  // Chat messages for AI context
  const { messages: chatMessages } = useIncidentChat({ incidentId: id, enabled: true });

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

  const SelectedUrgencyIcon =
    URGENCY_FILTER_OPTIONS.find((o) => o.value === urgencyFilter)?.icon ||
    Filter;
  const SelectedTypeIcon =
    TYPE_FILTER_OPTIONS.find((o) => o.value === typeFilter)?.icon || Layers;

  if (incLoading) {
    return (
      <div className="flex h-full flex-col md:flex-row">
        <div className="bg-muted flex-1 animate-pulse" />
        <div className="sidebar-panel flex w-full shrink-0 flex-col space-y-4 border-l border-[#E2E8F0] p-5 md:w-[460px]">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
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
          <p className="text-foreground text-lg font-semibold">
            Incident not found
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
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

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="border-b border-[#E2E8F0] px-5 py-4 bg-muted/20">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-muted-foreground hover:text-foreground text-xs font-medium"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to all incidents
          </Button>
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Incident Details
            </span>
          </div>
          <h1 className="text-foreground text-xl font-bold tracking-tight leading-tight">
            {incident.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <div
            className={cn(
              "flex items-center gap-1 font-semibold",
              config.color,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </div>
          <span className="text-muted-foreground/30">·</span>
          <Badge
            variant="secondary"
            className={cn(
              "border-0 text-[10px] font-semibold tracking-wider uppercase",
              incident.status === "active"
                ? "badge-active"
                : incident.status === "resolved"
                  ? "badge-resolved"
                  : "badge-archived",
            )}
          >
            {incident.status}
          </Badge>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <MapPin className="h-3 w-3" />
            {incident.lat.toFixed(2)}, {incident.lng.toFixed(2)}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-muted-foreground font-medium">
            {incident.radiusKm} km
          </span>
        </div>

        <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
          {incident.description}
        </p>
      </div>

      {/* Request filters + create */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3">
        <div className="flex items-center gap-2">
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="h-7 w-auto rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)] text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <SelectValue placeholder="Urgency" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {URGENCY_FILTER_OPTIONS.map(({ value, label, icon: FIcon }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <FIcon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 w-auto rounded-lg border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)] text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTER_OPTIONS.map(({ value, label, icon: FIcon }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <FIcon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                </SelectItem>
              ))}
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
      <div className="w-full">
        <div className="space-y-2 p-4">
          {reqLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                <Users className="text-muted-foreground/50 h-5 w-5" />
              </div>
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
      </div>

      <div className="border-t border-[#E2E8F0] px-5 py-2.5">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wide">
          {filteredRequests.length} request
          {filteredRequests.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Live Chat */}
      <IncidentChat incidentId={id} />

      {/* AI Summary */}
      {incident && (
        <AISummary
          incident={incident}
          requests={filteredRequests}
          chatMessages={chatMessages}
        />
      )}

      {/* AI Chat */}
      {incident && (
        <AIChat
          incident={incident}
          requests={filteredRequests}
          chatMessages={chatMessages}
        />
      )}
    </>
  );

  // ── Mobile layout — drawer ──────────────────────────────────────
  if (isMobile) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <MapView
            incidents={[incident]}
            center={[incident.lat, incident.lng]}
            zoom={12}
            selectedIncidentId={incident.id}
          />
        </div>

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 z-[10]">
          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-md border-border/50" onClick={() => router.push("/dashboard")}>
             <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-6 left-4 right-4 z-[10]">
          <Drawer defaultOpen={true}>
            <DrawerTrigger asChild>
              <Button className="w-full h-14 rounded-2xl shadow-xl flex items-center justify-between px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <div className="flex flex-col items-start min-w-0 flex-1 mr-4">
                  <span className="font-bold text-sm truncate w-full text-left">{incident.title}</span>
                  <span className="text-[10px] uppercase font-semibold text-primary-foreground/80 tracking-wider mt-0.5">
                    {filteredRequests.length} Request{filteredRequests.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary-foreground/20">
                   <ChevronUp className="h-4 w-4" />
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] bg-background">
              <div className="flex-1 overflow-y-auto min-h-0 bg-background rounded-t-[10px] pb-6">
                {sidebarContent}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────────
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

      {/* Right panel — wider at 460px */}
      <aside className="sidebar-panel bg-background w-[460px] shrink-0 overflow-y-auto pb-8 border-l border-[#E2E8F0]">
        {sidebarContent}
      </aside>
    </div>
  );
}
