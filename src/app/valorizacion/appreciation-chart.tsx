"use client";

import type { PriceHistoryEntry } from "@/lib/reservas/types";

type Props = {
  data: PriceHistoryEntry[];
};

const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

export default function AppreciationChart({ data }: Props) {
  // Only show entries with appreciation_total
  const points = data.filter((d) => d.appreciation_total != null);
  if (points.length < 2) return null;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxY = Math.max(...points.map((d) => d.appreciation_total!));
  const minY = Math.min(0, ...points.map((d) => d.appreciation_total!));
  const rangeY = maxY - minY || 1;

  function x(i: number) {
    return PADDING.left + (i / (points.length - 1)) * innerW;
  }
  function y(val: number) {
    return PADDING.top + innerH - ((val - minY) / rangeY) * innerH;
  }

  const linePts = points.map((d, i) => `${x(i)},${y(d.appreciation_total!)}`).join(" ");
  const areaPts = `${x(0)},${y(0)} ${linePts} ${x(points.length - 1)},${y(0)}`;

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Apreciacion Acumulada
      </h2>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={y(minY + rangeY * pct)}
              y2={y(minY + rangeY * pct)}
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
          ))}

          {/* Area fill */}
          <polygon
            points={areaPts}
            fill="var(--color-success)"
            opacity={0.12}
          />

          {/* Line */}
          <polyline
            points={linePts}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Dots */}
          {points.map((d, i) => (
            <circle
              key={d.id}
              cx={x(i)}
              cy={y(d.appreciation_total!)}
              r={3}
              fill="var(--color-success)"
            />
          ))}

          {/* X-axis labels */}
          {points.map((d, i) => {
            const showLabel = points.length <= 12 || i % 3 === 0 || i === points.length - 1;
            return showLabel ? (
              <text
                key={d.id}
                x={x(i)}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-muted)"
              >
                {d.effective_date.slice(5)}
              </text>
            ) : null;
          })}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((pct) => {
            const val = minY + rangeY * pct;
            return (
              <text
                key={pct}
                x={PADDING.left - 6}
                y={y(val) + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--color-muted)"
              >
                Q{Math.round(val).toLocaleString("es-GT")}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
