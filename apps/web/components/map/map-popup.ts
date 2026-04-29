/**
 * Generates rich Leaflet popup HTML for incident markers.
 * Shows a Snap Map-inspired card with incident info + resource summary.
 */
import type { Incident, ResourceRequest } from "@/lib/api";
import { INCIDENT_COLORS, INCIDENT_LABELS } from "./map-config";

const RESOURCE_EMOJI: Record<string, string> = {
  blood: "🩸",
  medicine: "💊",
  rescue: "🚁",
  food: "🍞",
  shelter: "🏠",
  other: "📦",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#166534" },
  resolved: { bg: "#f1f5f9", text: "#475569" },
  archived: { bg: "#f8fafc", text: "#94a3b8" },
};

/**
 * Build HTML string for a Leaflet popup.
 * Shows the incident card with optional resource request summary.
 */
export function buildPopupHTML(
  incident: Incident,
  requests?: ResourceRequest[],
): string {
  const color = INCIDENT_COLORS[incident.type] || INCIDENT_COLORS.other;
  const label = INCIDENT_LABELS[incident.type] || "Other";
  const status = (STATUS_COLORS[incident.status] ?? STATUS_COLORS.active)!;

  // Group requests by type and count
  const resourceCounts: Record<string, number> = {};
  let totalVolunteers = 0;
  let maxVolunteers = 0;

  if (requests?.length) {
    for (const r of requests) {
      resourceCounts[r.type] = (resourceCounts[r.type] || 0) + 1;
      totalVolunteers += r.volunteerCount ?? 0;
      maxVolunteers += r.maxVolunteers;
    }
  }

  const resourceChips = Object.entries(resourceCounts)
    .map(
      ([type, count]) =>
        `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;background:#f8fafc;font-size:11px;font-weight:600;color:#334155;">${RESOURCE_EMOJI[type] || "📦"} ${count}</span>`,
    )
    .join(" ");

  const volunteerBar =
    maxVolunteers > 0
      ? `<div style="margin-top:8px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-bottom:3px;">
            <span>Volunteers</span>
            <span style="font-weight:600;color:#334155;">${totalVolunteers}/${maxVolunteers}</span>
          </div>
          <div style="height:4px;border-radius:2px;background:#e2e8f0;overflow:hidden;">
            <div style="height:100%;width:${Math.min(100, (totalVolunteers / maxVolunteers) * 100)}%;border-radius:2px;background:${color};transition:width 300ms ease;"></div>
          </div>
        </div>`
      : "";

  const requestCount = requests?.length ?? 0;

  return `
    <div style="font-family:'Geist',ui-sans-serif,system-ui,sans-serif;min-width:220px;max-width:280px;padding:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:32px;height:32px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-size:16px;filter:brightness(0) invert(1);line-height:1;">●</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${incident.title}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${color};">${label}</span>
            <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:${status.bg};color:${status.text};font-weight:600;text-transform:uppercase;">${incident.status}</span>
          </div>
        </div>
      </div>

      ${incident.description ? `<p style="font-size:11px;color:#64748b;line-height:1.5;margin:0 0 8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${incident.description}</p>` : ""}

      ${resourceChips ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">${resourceChips}</div>` : ""}

      ${volunteerBar}

      <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:10px;color:#94a3b8;">${requestCount} request${requestCount !== 1 ? "s" : ""} · ${incident.radiusKm}km radius</span>
        <a href="/dashboard/incidents/${incident.id}" style="font-size:11px;font-weight:600;color:${color};text-decoration:none;display:flex;align-items:center;gap:2px;">
          View →
        </a>
      </div>
    </div>
  `;
}
