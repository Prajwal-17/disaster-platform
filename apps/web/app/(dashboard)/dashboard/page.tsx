"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useIncidents } from "@/lib/queries";
import { useMapStore } from "@/lib/stores/map-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { IncidentList } from "@/components/incidents/incident-list";
import { IncidentFilters } from "@/components/incidents/incident-filters";
import { CreateIncidentDialog } from "@/components/incidents/create-incident-dialog";
import { SOSButton } from "@/components/sos/sos-button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PanelRightClose, PanelRightOpen, List, X, Filter } from "lucide-react";
import type { Incident } from "@/lib/api";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
  },
);

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

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const filters = useMapStore((s) => s.filters);
  const selectedId = useMapStore((s) => s.selectedIncidentId);
  const setSelectedIncident = useMapStore((s) => s.setSelectedIncident);
  const sidebarOpen = useMapStore((s) => s.sidebarOpen);
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  // Mobile bottom sheet state
  const [sheetExpanded, setSheetExpanded] = useState(false);

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

  // ── Mobile layout ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        {/* Full-screen map */}
        <div className="absolute inset-0 z-0">
          <MapView
            incidents={filtered}
            center={center}
            zoom={zoom}
            selectedIncidentId={selectedId}
            onIncidentClick={(incident) => {
              handleIncidentSelect(incident); // Directly go to details page on map click
            }}
            onMapMove={(c, z) => {
              setCenter(c);
              setZoom(z);
            }}
          />
        </div>

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-[10] flex items-center justify-between pointer-events-none">
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-md pointer-events-auto border-border/50">
                <Filter className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="border-b border-border/50 text-left">
                <DrawerTitle>Filters</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                <IncidentFilters className="border-0 px-0 py-2" />
              </div>
            </DrawerContent>
          </Drawer>

          {canCreateIncident && (
            <div className="pointer-events-auto">
              <CreateIncidentDialog />
            </div>
          )}
        </div>

        {/* Floating SOS */}
        <div className="absolute bottom-[90px] right-4 z-[10]">
           <SOSButton incidents={incidents} />
        </div>

        {/* Bottom Bar to open List Drawer */}
        <div className="absolute bottom-6 left-4 right-4 z-[10]">
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="w-full h-12 rounded-2xl shadow-xl flex items-center justify-between px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <span className="font-bold text-sm">
                  {filtered.length} Incident{filtered.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <List className="h-4 w-4" /> View List
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="border-b border-border/50 flex flex-row items-center justify-between px-5">
                <DrawerTitle className="text-lg font-bold">Incidents</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto min-h-0 p-4">
                <IncidentList
                  incidents={filtered}
                  isLoading={isLoading}
                  selectedId={selectedId}
                  onSelect={handleIncidentSelect}
                />
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

        <SOSButton incidents={incidents} />
      </div>

      {/* Sidebar — wider at 400px */}
      {sidebarOpen && (
        <aside className="sidebar-panel flex w-[400px] shrink-0 flex-col border-l border-[#E2E8F0]">
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
