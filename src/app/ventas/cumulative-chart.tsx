"use client";

import type { VentasMonthlySeries } from "@/lib/reservas/types";

type Props = {
  data: VentasMonthlySeries[];
  totalUnits: number;
};

const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export default function CumulativeChart({ data, totalUnits }: Props) {
  if (data.length < 2) return null;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxY = Math.max(totalUnits, ...data.map((d) => d.cumulative));

  function x(i: number) {
    return PADDING.left + (i / (data.length - 1)) * innerW;
  }
  function y(val: number) {
    return PADDING.top + innerH - (val / maxY) * innerH;
  }

  const points = data.map((d, i) => `${x(i)},${y(d.cumulative)}`).join(" ");

  // Total units reference line
  const totalY = y(totalUnits);

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Ventas Acumuladas</h2>
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
              y1={y(maxY * pct)}
              y2={y(maxY * pct)}
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
          ))}

          {/* Total units reference line */}
          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={totalY}
            y2={totalY}
            stroke="var(--color-muted)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={CHART_WIDTH - PADDING.right}
            y={totalY - 4}
            textAnchor="end"
            fontSize={9}
            fill="var(--color-muted)"
          >
            Total: {totalUnits}
          </text>

          {/* Area fill */}
          <polygon
            points={`${x(0)},${y(0)} ${points} ${x(data.length - 1)},${y(0)}`}
            fill="var(--color-primary)"
            opacity={0.1}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={d.month}
              cx={x(i)}
              cy={y(d.cumulative)}
              r={3}
              fill="var(--color-primary)"
            />
          ))}

          {/* X-axis labels (every 3rd or fewer) */}
          {data.map((d, i) => {
            const showLabel = data.length <= 12 || i % 3 === 0 || i === data.length - 1;
            return showLabel ? (
              <text
                key={d.month}
                x={x(i)}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-muted)"
              >
                {d.month.slice(5)}
              </text>
            ) : null;
          })}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((pct) => (
            <text
              key={pct}
              x={PADDING.left - 6}
              y={y(maxY * pct) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--color-muted)"
            >
              {Math.round(maxY * pct)}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
