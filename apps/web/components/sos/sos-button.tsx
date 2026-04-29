"use client";

/**
 * Floating SOS button — pulsing red FAB on the map.
 * Opens the SOSDialog for emergency help requests.
 */
import { useState } from "react";
import { SOSDialog } from "@/components/sos/sos-dialog";
import { AlertTriangle } from "lucide-react";
import type { Incident } from "@/lib/api";

type Props = {
  incidents: Incident[];
};

export function SOSButton({ incidents }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-8 left-6 z-[1000] flex items-center gap-2.5 rounded-full bg-red-600 px-5 py-3 text-white shadow-[0_8px_30px_rgb(220,38,38,0.4)] transition-all hover:bg-red-700 hover:shadow-[0_8px_30px_rgb(220,38,38,0.6)] active:scale-95 sos-pulse"
        title="Send SOS — Request emergency help"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-[13px] font-bold tracking-wide">SOS</span>
      </button>

      <SOSDialog
        open={open}
        onOpenChange={setOpen}
        incidents={incidents}
      />
    </>
  );
}
