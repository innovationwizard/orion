"use client";

import { UNIT_STATUSES, UNIT_STATUS_LABELS, UNIT_STATUS_COLORS } from "@/lib/reservas/constants";

export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {UNIT_STATUSES.map((s) => (
        <div key={s} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ backgroundColor: UNIT_STATUS_COLORS[s] }}
          />
          <span className="text-muted">{UNIT_STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}
