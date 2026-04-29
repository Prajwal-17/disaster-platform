const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function getAuthHeaders(): Promise<HeadersInit> {
  // Try to get JWT token from better-auth
  try {
    const res = await fetch(`${API_BASE}/api/auth/token`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        };
      }
    }
  } catch {
    // fallback to cookie-based auth
  }
  return { "Content-Type": "application/json" };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export type Incident = {
  id: string;
  title: string;
  description: string;
  type: "flood" | "earthquake" | "cyclone" | "fire" | "other";
  status: "active" | "resolved" | "archived";
  lat: number;
  lng: number;
  radiusKm: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ResourceRequest = {
  id: string;
  incidentId: string;
  requesterId: string;
  type: "blood" | "medicine" | "rescue" | "food" | "shelter" | "other";
  title: string;
  description: string;
  lat: number;
  lng: number;
  urgency: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "fulfilled" | "cancelled";
  maxVolunteers: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  volunteerCount?: number;
};

export type VolunteerResponse = {
  id: string;
  requestId: string;
  volunteerId: string;
  status: "en_route" | "arrived" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export async function getIncidents(params?: {
  status?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.lat) query.set("lat", String(params.lat));
  if (params?.lng) query.set("lng", String(params.lng));
  if (params?.radius_km) query.set("radius_km", String(params.radius_km));
  const qs = query.toString();
  const res = await apiFetch<{ incidents: Incident[] }>(`/api/incidents${qs ? `?${qs}` : ""}`);
  return res.incidents;
}

export function getIncident(id: string) {
  return apiFetch<{ incident: Incident }>(`/api/incidents/${id}`);
}

export function createIncident(data: {
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
  radius_km?: number;
}) {
  return apiFetch<{ incident: Incident }>("/api/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateIncident(id: string, data: Partial<Incident>) {
  return apiFetch<{ incident: Incident }>(`/api/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Resource Requests ────────────────────────────────────────────────────────

export async function getRequests(
  incidentId: string,
  params?: { status?: string; type?: string; urgency?: string }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.urgency) query.set("urgency", params.urgency);
  const qs = query.toString();
  const res = await apiFetch<{ requests: ResourceRequest[] }>(
    `/api/incidents/${incidentId}/requests${qs ? `?${qs}` : ""}`
  );
  return res.requests;
}

export function createRequest(
  incidentId: string,
  data: {
    title: string;
    description: string;
    type: string;
    lat: number;
    lng: number;
    urgency?: string;
    maxVolunteers?: number;
  }
) {
  return apiFetch<{ request: ResourceRequest }>(
    `/api/incidents/${incidentId}/requests`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function getRequest(id: string) {
  return apiFetch<{ request: ResourceRequest }>(`/api/requests/${id}`);
}

export function updateRequest(id: string, data: Partial<ResourceRequest>) {
  return apiFetch<{ request: ResourceRequest }>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Volunteer Responses ──────────────────────────────────────────────────────

export function respondToRequest(requestId: string) {
  return apiFetch<{ response: VolunteerResponse; warning?: string }>(
    `/api/requests/${requestId}/respond`,
    { method: "POST" }
  );
}

export function updateResponseStatus(
  requestId: string,
  status: "en_route" | "arrived" | "cancelled"
) {
  return apiFetch<{ response: VolunteerResponse }>(
    `/api/requests/${requestId}/respond`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export function withdrawResponse(requestId: string) {
  return apiFetch<{ message: string }>(
    `/api/requests/${requestId}/respond`,
    { method: "DELETE" }
  );
}

export async function getVolunteers(requestId: string) {
  const res = await apiFetch<{ volunteers: VolunteerResponse[] }>(
    `/api/requests/${requestId}/volunteers`
  );
  return res.volunteers;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export function updateLocation(lat: number, lng: number) {
  return apiFetch<{ location: unknown }>("/api/location", {
    method: "PUT",
    body: JSON.stringify({ lat, lng }),
  });
}

export async function getNearbyLocations(lat: number, lng: number, radiusKm = 10) {
  const res = await apiFetch<{ locations: unknown[] }>(
    `/api/location/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`
  );
  return res.locations;
}
