import { create } from "zustand";

type IncidentFilter = {
  status: "all" | "active" | "resolved";
  type: "all" | "flood" | "earthquake" | "cyclone" | "fire" | "other";
};

type MapState = {
  selectedIncidentId: string | null;
  filters: IncidentFilter;
  center: [number, number];
  zoom: number;
  sidebarOpen: boolean;

  setSelectedIncident: (id: string | null) => void;
  setFilters: (filters: Partial<IncidentFilter>) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useMapStore = create<MapState>((set) => ({
  selectedIncidentId: null,
  filters: { status: "active", type: "all" },
  center: [20.5937, 78.9629], // India center
  zoom: 5,
  sidebarOpen: true,

  setSelectedIncident: (id) => set({ selectedIncidentId: id }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
