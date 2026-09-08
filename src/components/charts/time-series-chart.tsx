"use client";

import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3line, area as d3area, curveMonotoneX } from "d3-shape";
import { useElementSize } from "@/hooks/use-element-size";

export type TimeSeriesPoint = {
  /** Category label on the x axis, e.g. "2026-01". Ordinal, evenly spaced. */
  label: string;
  value: number;
  /** Optional second series drawn as a lighter line on the same y scale. */
  value2?: number;
};

type TimeSeriesChartProps = {
  data: TimeSeriesPoint[];
  height?: number;
  /** Formats y-axis ticks and the hover readout. */
  format?: (v: number) => string;
  seriesLabel?: string;
  series2Label?: string;
  /** Fill the area under the primary line. */
  area?: boolean;
};

const MARGIN = { top: 12, right: 12, bottom: 28, left: 56 };

/**
 * Line / area chart over an ordinal time axis, built with d3-shape and
 * d3-scale and rendered by React (d3-selection is deliberately not used — it
 * fights React for ownership of the DOM).
 */
export default function TimeSeriesChart({
  data,
  height = 240,
  format = (v) => String(Math.round(v)),
  seriesLabel,
  series2Label,
  area = false,
}: TimeSeriesChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const chartW = Math.max(0, size.width - MARGIN.left - MARGIN.right);
  const chartH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const hasSeries2 = useMemo(() => data.some((d) => d.value2 != null), [data]);

  const maxVal = useMemo(() => {
    let m = 0;
    for (const d of data) {
      if (d.value > m) m = d.value;
      if (d.value2 != null && d.value2 > m) m = d.value2;
    }
    return m > 0 ? m : 1;
  }, [data]);

  const x = useMemo(() => scalePoint<string>().domain(labels).range([0, chartW]), [labels, chartW]);
  const y = useMemo(() => scaleLinear().domain([0, maxVal]).range([chartH, 0]).nice(), [maxVal, chartH]);

  const linePath = useMemo(
    () =>
      d3line<TimeSeriesPoint>()
        .x((d) => x(d.label) ?? 0)
        .y((d) => y(d.value))
        .curve(curveMonotoneX)(data) ?? "",
    [data, x, y],
  );

  const areaPath = useMemo(
    () =>
      area
        ? d3area<TimeSeriesPoint>()
            .x((d) => x(d.label) ?? 0)
            .y0(chartH)
            .y1((d) => y(d.value))
            .curve(curveMonotoneX)(data) ?? ""
        : "",
    [area, data, x, y, chartH],
  );

  const line2Path = useMemo(
    () =>
      hasSeries2
        ? d3line<TimeSeriesPoint>()
            .defined((d) => d.value2 != null)
            .x((d) => x(d.label) ?? 0)
            .y((d) => y(d.value2 ?? 0))
            .curve(curveMonotoneX)(data) ?? ""
        : "",
    [hasSeries2, data, x, y],
  );

  if (!size.width) return <div ref={ref} style={{ width: "100%", height }} />;
  if (data.length === 0) {
    return (
      <div ref={ref} className="py-8 text-center text-muted text-sm">
        Sin datos para el periodo.
      </div>
    );
  }

  // Thin out x labels so they never collide.
  const step = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(chartW / 70))));
  const hovered = hover != null ? data[hover] : null;

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg width="100%" height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(5).map((t) => (
            <g key={t}>
              <line
                x1={0}
                x2={chartW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-border, #e2e8f0)"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
              <text x={-8} y={y(t) + 4} textAnchor="end" fontSize={10} fill="var(--color-muted, #64748b)">
                {format(t)}
              </text>
            </g>
          ))}

          {area && <path d={areaPath} fill="var(--color-primary)" opacity={0.14} />}
          {hasSeries2 && (
            <path d={line2Path} fill="none" stroke="var(--color-muted, #64748b)" strokeWidth={1.5} strokeDasharray="4 3" />
          )}
          <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2} />

          {hovered && (
            <line
              x1={x(hovered.label) ?? 0}
              x2={x(hovered.label) ?? 0}
              y1={0}
              y2={chartH}
              stroke="var(--color-primary)"
              strokeOpacity={0.35}
            />
          )}
          {data.map((d, i) =>
            hover === i ? (
              <circle key={d.label} cx={x(d.label) ?? 0} cy={y(d.value)} r={4} fill="var(--color-primary)" />
            ) : null,
          )}

          {labels.map((l, i) =>
            i % step === 0 ? (
              <text
                key={l}
                x={x(l) ?? 0}
                y={chartH + 18}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-muted, #64748b)"
              >
                {l}
              </text>
            ) : null,
          )}

          {/* Hover capture bands */}
          {data.map((d, i) => (
            <rect
              key={`hit-${d.label}`}
              x={(x(d.label) ?? 0) - chartW / Math.max(1, data.length) / 2}
              y={0}
              width={chartW / Math.max(1, data.length)}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </g>
      </svg>

      {hovered && (
        <div className="absolute top-0 right-0 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-card pointer-events-none">
          <div className="font-semibold text-text-primary">{hovered.label}</div>
          <div className="text-muted">
            {seriesLabel ? `${seriesLabel}: ` : ""}
            <span className="text-text-primary font-semibold tabular-nums">{format(hovered.value)}</span>
          </div>
          {hovered.value2 != null && (
            <div className="text-muted">
              {series2Label ? `${series2Label}: ` : ""}
              <span className="text-text-primary font-semibold tabular-nums">{format(hovered.value2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
