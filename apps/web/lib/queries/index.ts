"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  getRequests,
  createRequest,
  respondToRequest,
  updateResponseStatus,
  withdrawResponse,
  getVolunteers,
  type Incident,
  type ResourceRequest,
} from "@/lib/api";

// ─── Incidents ────────────────────────────────────────────────────────────────

export function useIncidents(params?: {
  status?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => getIncidents(params),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Incident> }) =>
      updateIncident(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({
        queryKey: ["incident", variables.id],
      });
    },
  });
}

// ─── Resource Requests ────────────────────────────────────────────────────────

export function useRequests(
  incidentId: string,
  params?: { status?: string; type?: string; urgency?: string }
) {
  return useQuery({
    queryKey: ["requests", incidentId, params],
    queryFn: () => getRequests(incidentId, params),
    enabled: !!incidentId,
  });
}

export function useCreateRequest(incidentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      type: string;
      lat: number;
      lng: number;
      urgency?: string;
      maxVolunteers?: number;
    }) => createRequest(incidentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["requests", incidentId],
      });
    },
  });
}

// ─── Volunteer Responses ──────────────────────────────────────────────────────

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => respondToRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateResponseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: string;
      status: "en_route" | "arrived" | "cancelled";
    }) => updateResponseStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useWithdrawResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => withdrawResponse(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useVolunteers(requestId: string) {
  return useQuery({
    queryKey: ["volunteers", requestId],
    queryFn: () => getVolunteers(requestId),
    enabled: !!requestId,
  });
}
