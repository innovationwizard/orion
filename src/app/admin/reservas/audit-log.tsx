"use client";

import type { UnitStatusLog } from "@/lib/reservas/types";
import { UNIT_STATUS_LABELS, formatDate } from "@/lib/reservas/constants";

type Props = {
  entries: UnitStatusLog[];
};

export default function AuditLog({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted">Sin historial de cambios.</p>;
  }

  return (
    <div className="grid gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Historial de cambios
      </h4>
      <div className="grid gap-1.5">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-2 text-xs"
          >
            <span className="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-border" />
            <div className="min-w-0">
              <span className="text-muted">{formatDate(e.created_at)}</span>
              {" — "}
              <span className="text-text-primary">
                {e.old_status
                  ? `${UNIT_STATUS_LABELS[e.old_status] ?? e.old_status} → ${UNIT_STATUS_LABELS[e.new_status] ?? e.new_status}`
                  : UNIT_STATUS_LABELS[e.new_status] ?? e.new_status}
              </span>
              {e.reason && (
                <span className="text-muted"> — {e.reason}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
