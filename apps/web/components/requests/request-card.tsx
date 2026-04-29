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
  critical: {
    badge: "bg-[oklch(0.93_0.04_25)] text-[oklch(0.42_0.18_25)] border-[oklch(0.89_0.04_25)]",
    text: "text-[oklch(0.48_0.18_25)]",
  },
  high: {
    badge: "bg-[oklch(0.93_0.05_50)] text-[oklch(0.45_0.16_50)] border-[oklch(0.89_0.05_50)]",
    text: "text-[oklch(0.50_0.16_50)]",
  },
  medium: {
    badge: "bg-[oklch(0.93_0.05_80)] text-[oklch(0.45_0.14_80)] border-[oklch(0.89_0.05_80)]",
    text: "text-[oklch(0.50_0.14_80)]",
  },
  low: {
    badge: "bg-[oklch(0.92_0.05_155)] text-[oklch(0.38_0.12_155)] border-[oklch(0.88_0.05_155)]",
    text: "text-[oklch(0.44_0.12_155)]",
  },
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[oklch(0.92_0.05_250)] text-[oklch(0.38_0.14_250)]",
  in_progress: "bg-[oklch(0.93_0.05_80)] text-[oklch(0.42_0.12_80)]",
  fulfilled: "bg-[oklch(0.92_0.06_155)] text-[oklch(0.35_0.12_155)]",
  cancelled: "bg-[oklch(0.94_0.003_250)] text-[oklch(0.50_0.01_250)]",
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
    <div className="request-card">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-semibold leading-tight text-foreground">
              {request.title}
            </h3>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wider", urgencyStyle.badge)}
            >
              {request.urgency}
            </Badge>
          </div>

          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {request.description}
          </p>

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span
                className={cn(
                  "font-semibold",
                  volRatio >= 1
                    ? "text-[oklch(0.48_0.14_155)]"
                    : volRatio >= 0.8
                      ? "text-[oklch(0.50_0.14_80)]"
                      : "text-foreground"
                )}
              >
                {volCount}/{request.maxVolunteers}
              </span>
            </span>
            <Badge variant="secondary" className={cn("text-[10px] font-semibold border-0", STATUS_STYLES[request.status])}>
              {request.status.replace("_", " ")}
            </Badge>
            <span className="flex items-center gap-1 uppercase font-semibold text-[10px] text-muted-foreground tracking-wider">
              <MapPin className="h-3 w-3" />
              {request.type}
            </span>
          </div>

          {/* Action */}
          {canRespond && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-8 gap-1.5 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30"
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
