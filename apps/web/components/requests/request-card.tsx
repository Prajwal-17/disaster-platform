"use client";

import type { ResourceRequest } from "@/lib/api";
import { useRespondToRequest } from "@/lib/queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Droplet,
  Pill,
  LifeBuoy,
  Utensils,
  Home,
  Package,
  Users,
  MapPin,
  Loader2,
  HandHelping,
} from "lucide-react";

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  blood: Droplet,
  medicine: Pill,
  rescue: LifeBuoy,
  food: Utensils,
  shelter: Home,
  other: Package,
};

const URGENCY_STYLES: Record<string, { badge: string; text: string }> = {
  critical: { badge: "bg-red-100 text-red-700 border-red-200", text: "text-red-600" },
  high: { badge: "bg-orange-100 text-orange-700 border-orange-200", text: "text-orange-600" },
  medium: { badge: "bg-amber-100 text-amber-700 border-amber-200", text: "text-amber-600" },
  low: { badge: "bg-green-100 text-green-700 border-green-200", text: "text-green-600" },
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  fulfilled: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

type Props = {
  request: ResourceRequest;
};

export function RequestCard({ request }: Props) {
  const user = useAuthStore((s) => s.user);
  const respond = useRespondToRequest();

  const Icon = RESOURCE_ICONS[request.type] || Package;
  const urgencyStyle = (URGENCY_STYLES[request.urgency] || URGENCY_STYLES.medium)!;
  const volCount = request.volunteerCount ?? 0;
  const volRatio = volCount / request.maxVolunteers;

  const canRespond =
    (user?.role === "volunteer" || user?.role === "donor") &&
    request.status === "open";

  const handleRespond = () => {
    respond.mutate(request.id, {
      onSuccess: (data) => {
        if (data.warning) {
          toast.warning(data.warning);
        } else {
          toast.success("You're on your way! Stay safe.");
        }
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  return (
    <div className="rounded-md border bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-tight">
              {request.title}
            </h3>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px] uppercase", urgencyStyle.badge)}
            >
              {request.urgency}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {request.description}
          </p>

          {/* Meta row */}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span
                className={cn(
                  "font-medium",
                  volRatio >= 1
                    ? "text-green-600"
                    : volRatio >= 0.8
                      ? "text-amber-600"
                      : ""
                )}
              >
                {volCount}/{request.maxVolunteers}
              </span>
            </span>
            <Badge variant="secondary" className={cn("text-[10px]", STATUS_STYLES[request.status])}>
              {request.status.replace("_", " ")}
            </Badge>
            <span className="flex items-center gap-1 uppercase font-medium">
              <MapPin className="h-3 w-3" />
              {request.type}
            </span>
          </div>

          {/* Action */}
          {canRespond && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 gap-1 text-xs"
              onClick={handleRespond}
              disabled={respond.isPending}
            >
              {respond.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <HandHelping className="h-3 w-3" />
              )}
              Respond
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
