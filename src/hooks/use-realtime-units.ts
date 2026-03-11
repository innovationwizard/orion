"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createReservasClient } from "@/lib/supabase/client";
import type { UnitFull, RvUnitStatus } from "@/lib/reservas/types";

type ConnectionState = "connecting" | "connected" | "disconnected";

export function useRealtimeUnits(
  units: UnitFull[],
  setUnits: Dispatch<SetStateAction<UnitFull[]>>,
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const supabaseRef = useRef(createReservasClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel("rv_units_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rv_units" },
        (payload) => {
          const updated = payload.new as { id: string; status: RvUnitStatus; status_detail: string | null; status_changed_at: string | null };
          setUnits((prev) =>
            prev.map((u) =>
              u.id === updated.id
                ? { ...u, status: updated.status, status_detail: updated.status_detail, status_changed_at: updated.status_changed_at }
                : u,
            ),
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionState("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setUnits]);

  return { connectionState };
}
