"use client";

import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useElementSize } from "@/hooks/use-element-size";

export type BulletDatum = {
  /** Row label, e.g. the project name. */
  label: string;
  /** Secondary line under the label, e.g. "6 asesores × 2 · entrega 2026". */
  sublabel?: string;
  /** Actual achieved value. */
  value: number;
  /** Target value. A target of 0 means "no meta set" and renders as a plain count. */
  target: number;
};

type BulletChartProps = {
  data: BulletDatum[];
  /** Accessible caption describing what the measure counts. */
  valueLabel?: string;
  targetLabel?: string;
};

const ROW_H = 52;
const BAR_H = 18;
const LABEL_W = 168;
const VALUE_W = 132;
const MARGIN = { top: 14, right: 8, bottom: 22 };

/**
 * Bullet chart (Stephen Few) for absolute counts against a target: one row per
 * entity, the achieved measure as a bar, a target marker, qualitative bands
 * behind it, and a quantitative axis. Reads at a glance as "am I over or under
 * goal, and by how much" — the déficit/excedente column of the sales sheet.
 *
 * Distinct from `@/components/bullet-chart`, which the dashboard uses for
 * percentage-compliance metrics on a fixed 0–120% scale with no axis. Keep them
 * separate: this one is driven by the data's own domain via d3 `scaleLinear`.
 */
export default function MetaBulletChart({
  data,
  valueLabel = "Ventas",
  targetLabel = "Meta",
}: BulletChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const trackW = Math.max(0, size.width - LABEL_W - VALUE_W - MARGIN.right);

  // Domain covers the largest of any value or target so no bar is clipped,
  // with 10% headroom so a bar that beats its target still reads as "past" it.
  const maxVal = useMemo(() => {
    let max = 0;
    for (const d of data) {
      if (d.value > max) max = d.value;
      if (d.target > max) max = d.target;
    }
    return max > 0 ? max * 1.1 : 1;
  }, [data]);

  const x = useMemo(() => scaleLinear().domain([0, maxVal]).range([0, trackW]).nice(), [maxVal, trackW]);

  const height = data.length * ROW_H + MARGIN.top + MARGIN.bottom;

  if (!size.width) {
    return <div ref={ref} style={{ width: "100%", height }} />;
  }

  if (data.length === 0) {
    return (
      <div ref={ref} className="py-8 text-center text-muted text-sm">
        Sin proyectos con datos para el periodo.
      </div>
    );
  }

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width="100%" height={height} role="img" aria-label={`${valueLabel} contra ${targetLabel} por proyecto`}>
        {/* Vertical gridlines + axis ticks */}
        <g transform={`translate(${LABEL_W},0)`}>
          {x.ticks(5).map((tick) => (
            <g key={tick}>
              <line
                x1={x(tick)}
                x2={x(tick)}
                y1={MARGIN.top - 6}
                y2={height - MARGIN.bottom}
                stroke="var(--color-border, #e2e8f0)"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
              <text
                x={x(tick)}
                y={height - MARGIN.bottom + 14}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-muted, #64748b)"
              >
                {tick}
              </text>
            </g>
          ))}
        </g>

        {data.map((d, i) => {
          const rowY = MARGIN.top + i * ROW_H;
          const barY = rowY + (ROW_H - BAR_H) / 2 - 4;
          const hasTarget = d.target > 0;
          const met = hasTarget && d.value >= d.target;
          const delta = d.value - d.target;
          const pct = hasTarget ? Math.round((d.value / d.target) * 100) : null;
          const barColor = !hasTarget
            ? "var(--color-primary, #2563eb)"
            : met
              ? "var(--color-success, #16a34a)"
              : "var(--color-danger, #dc2626)";

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              {/* Row hover highlight */}
              <rect
                x={0}
                y={rowY - 4}
                width={size.width}
                height={ROW_H}
                fill="var(--color-border, #e2e8f0)"
                opacity={hover === i ? 0.25 : 0}
                rx={6}
              />

              {/* Label */}
              <text x={0} y={barY + 4} fontSize={12} fontWeight={600} fill="var(--color-text-primary, #0f172a)">
                {d.label.length > 22 ? `${d.label.slice(0, 20)}…` : d.label}
              </text>
              {d.sublabel && (
                <text x={0} y={barY + 19} fontSize={10} fill="var(--color-muted, #64748b)">
                  {d.sublabel.length > 26 ? `${d.sublabel.slice(0, 24)}…` : d.sublabel}
                </text>
              )}

              <g transform={`translate(${LABEL_W},0)`}>
                {/* Qualitative bands behind the measure: 0–70%, 70–100%, 100%+ of target */}
                {hasTarget && (
                  <>
                    <rect
                      x={0}
                      y={barY - 3}
                      width={x(d.target)}
                      height={BAR_H + 6}
                      fill="var(--color-border, #e2e8f0)"
                      opacity={0.35}
                      rx={4}
                    />
                    <rect
                      x={x(d.target * 0.7)}
                      y={barY - 3}
                      width={Math.max(0, x(d.target) - x(d.target * 0.7))}
                      height={BAR_H + 6}
                      fill="var(--color-border, #e2e8f0)"
                      opacity={0.5}
                      rx={4}
                    />
                  </>
                )}

                {/* Measure bar */}
                <rect
                  x={0}
                  y={barY}
                  width={Math.max(d.value > 0 ? 2 : 0, x(d.value))}
                  height={BAR_H}
                  fill={barColor}
                  opacity={0.9}
                  rx={3}
                />

                {/* Target marker */}
                {hasTarget && (
                  <line
                    x1={x(d.target)}
                    x2={x(d.target)}
                    y1={barY - 5}
                    y2={barY + BAR_H + 5}
                    stroke="var(--color-text-primary, #0f172a)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}
              </g>

              {/* Value readout */}
              <g transform={`translate(${size.width - MARGIN.right},0)`}>
                <text x={0} y={barY + 4} textAnchor="end" fontSize={12} fill="var(--color-text-primary, #0f172a)">
                  <tspan fontWeight={700}>{d.value}</tspan>
                  {hasTarget && <tspan fill="var(--color-muted, #64748b)"> / {d.target}</tspan>}
                </text>
                {hasTarget ? (
                  <text
                    x={0}
                    y={barY + 19}
                    textAnchor="end"
                    fontSize={10}
                    fontWeight={600}
                    fill={met ? "var(--color-success, #16a34a)" : "var(--color-danger, #dc2626)"}
                  >
                    {delta >= 0 ? `+${delta} excedente` : `${delta} déficit`} · {pct}%
                  </text>
                ) : (
                  <text x={0} y={barY + 19} textAnchor="end" fontSize={10} fill="var(--color-muted, #64748b)">
                    sin meta
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-success/90" /> {valueLabel} — meta cumplida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-danger/90" /> {valueLabel} — bajo meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-0.5 h-3.5 bg-text-primary" /> {targetLabel}
        </span>
      </div>
    </div>
  );
}
