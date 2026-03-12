"use client";

import type { VentasMonthlySeries } from "@/lib/reservas/types";

type Props = {
  data: VentasMonthlySeries[];
};

const BAR_WIDTH = 24;
const GAP = 8;
const CHART_HEIGHT = 200;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 40;

export default function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted">
        Sin datos mensuales.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.reservations), 1);
  const chartWidth = data.length * (BAR_WIDTH * 2 + GAP) + GAP;
  const barArea = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function y(val: number) {
    return PADDING_TOP + barArea - (val / maxVal) * barArea;
  }

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Reservas vs Desistimientos por Mes</h2>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary" /> Reservas
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-danger" /> Desistimientos
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={Math.max(chartWidth, 300)}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${Math.max(chartWidth, 300)} ${CHART_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMinYMid meet"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1={0}
              x2={chartWidth}
              y1={y(maxVal * pct)}
              y2={y(maxVal * pct)}
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
          ))}

          {data.map((d, i) => {
            const x = GAP + i * (BAR_WIDTH * 2 + GAP);
            const resH = (d.reservations / maxVal) * barArea;
            const desH = (d.desisted / maxVal) * barArea;
            return (
              <g key={d.month}>
                {/* Reservations bar */}
                <rect
                  x={x}
                  y={y(d.reservations)}
                  width={BAR_WIDTH}
                  height={resH}
                  rx={3}
                  fill="var(--color-primary)"
                  opacity={0.85}
                />
                {d.reservations > 0 && (
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={y(d.reservations) - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--color-text-primary)"
                  >
                    {d.reservations}
                  </text>
                )}

                {/* Desisted bar */}
                <rect
                  x={x + BAR_WIDTH}
                  y={y(d.desisted)}
                  width={BAR_WIDTH}
                  height={desH}
                  rx={3}
                  fill="var(--color-danger)"
                  opacity={0.7}
                />

                {/* Month label */}
                <text
                  x={x + BAR_WIDTH}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-muted)"
                >
                  {d.month.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
