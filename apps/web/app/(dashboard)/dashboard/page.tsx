"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useIncidents } from "@/lib/queries";
import { useMapStore } from "@/lib/stores/map-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { IncidentList } from "@/components/incidents/incident-list";
import { IncidentFilters } from "@/components/incidents/incident-filters";
import { CreateIncidentDialog } from "@/components/incidents/create-incident-dialog";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import type { Incident } from "@/lib/api";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const filters = useMapStore((s) => s.filters);
  const selectedId = useMapStore((s) => s.selectedIncidentId);
  const setSelectedIncident = useMapStore((s) => s.setSelectedIncident);
  const sidebarOpen = useMapStore((s) => s.sidebarOpen);
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  const queryParams: Record<string, string | undefined> = {};
  if (filters.status !== "all") queryParams.status = filters.status;

  const { data: incidents = [], isLoading } = useIncidents(queryParams);

  // Filter by type on the client
  const filtered =
    filters.type === "all"
      ? incidents
      : incidents.filter((i) => i.type === filters.type);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident.id);
  };

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident.id);
    router.push(`/dashboard/incidents/${incident.id}`);
  };

  const canCreateIncident =
    user?.role === "ngo" || user?.role === "admin";

  return (
    <div className="flex h-full">
      {/* Map */}
      <div className="relative flex-1 min-w-0">
        {!sidebarOpen && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-3 right-3 z-[1000] h-9 w-9 bg-white shadow-sm border-[#E2E8F0] hover:bg-muted/60"
            onClick={toggleSidebar}
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}

        <MapView
          incidents={filtered}
          center={center}
          zoom={zoom}
          selectedIncidentId={selectedId}
          onIncidentClick={handleIncidentClick}
          onMapMove={(c, z) => {
            setCenter(c);
            setZoom(z);
          }}
        />
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="sidebar-panel flex w-[340px] shrink-0 flex-col border-l border-[#E2E8F0]">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
            <h2 className="text-[13px] font-semibold text-foreground tracking-tight">
              Incidents
            </h2>
            <div className="flex items-center gap-1.5">
              {canCreateIncident && <CreateIncidentDialog />}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={toggleSidebar}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <IncidentFilters />

          {/* List */}
          <div className="flex-1 overflow-hidden">
            <IncidentList
              incidents={filtered}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={handleIncidentSelect}
            />
          </div>

          {/* Count */}
          <div className="border-t border-[#E2E8F0] px-4 py-2.5">
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </aside>
      )}
    </div>
  );
}
