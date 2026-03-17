"use client";

import { useMemo } from "react";

interface MonthBucket {
  label: string;
  submitted: number;
  confirmed: number;
  desisted: number;
}

type Props = {
  buckets: MonthBucket[];
};

const BAR_HEIGHT = 160;
const BAR_WIDTH = 48;

export default function VelocityChart({ buckets }: Props) {
  const maxVal = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.submitted)),
    [buckets],
  );

  if (buckets.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-8">
        Sin datos para mostrar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-3 min-w-fit">
        {buckets.map((b) => {
          const submittedH = (b.submitted / maxVal) * BAR_HEIGHT;
          const confirmedH = (b.confirmed / maxVal) * BAR_HEIGHT;
          return (
            <div key={b.label} className="grid gap-1.5 items-end text-center">
              <div
                className="flex items-end gap-0.5 mx-auto"
                style={{ height: BAR_HEIGHT }}
              >
                {/* Submitted bar */}
                <div
                  className="rounded-t transition-all duration-300"
                  style={{
                    width: BAR_WIDTH / 2,
                    height: submittedH,
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.3,
                  }}
                  title={`Enviadas: ${b.submitted}`}
                />
                {/* Confirmed bar */}
                <div
                  className="rounded-t transition-all duration-300"
                  style={{
                    width: BAR_WIDTH / 2,
                    height: confirmedH,
                    backgroundColor: "var(--color-success, #22c55e)",
                  }}
                  title={`Confirmadas: ${b.confirmed}`}
                />
              </div>
              <span className="text-[10px] text-muted capitalize whitespace-nowrap">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              backgroundColor: "var(--color-primary)",
              opacity: 0.3,
            }}
          />
          Enviadas
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "var(--color-success, #22c55e)" }}
          />
          Confirmadas
        </div>
      </div>
    </div>
  );
}
