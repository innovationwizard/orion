"use client";

import { useMemo, useState } from "react";
import { arc as d3Arc, pie as d3Pie } from "d3-shape";
import { useElementSize } from "@/hooks/use-element-size";
import ChartTooltip, { type TooltipEntry } from "./chart-tooltip";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  innerRadiusRatio?: number; // 0 = full pie, 0.6 = donut
  height?: number;
}

export default function DonutChart({
  data,
  innerRadiusRatio = 0.6,
  height = 280,
}: DonutChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    entries: TooltipEntry[];
  } | null>(null);

  const filtered = useMemo(() => data.filter((d) => d.value > 0), [data]);

  const pieGen = useMemo(
    () =>
      d3Pie<DonutDatum>()
        .value((d) => d.value)
        .padAngle(0.03)
        .sort(null),
    [],
  );

  const arcs = useMemo(() => {
    if (!size.width) return [];
    const radius = Math.min(size.width, height) / 2 - 4;
    const inner = radius * innerRadiusRatio;
    const arcGen = d3Arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(inner)
      .outerRadius(radius)
      .cornerRadius(2);
    return pieGen(filtered).map((d) => ({
      path: arcGen(d) ?? "",
      datum: d.data,
      centroid: arcGen.centroid(d),
    }));
  }, [filtered, size.width, height, innerRadiusRatio, pieGen]);

  const cx = size.width / 2;
  const cy = height / 2;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height }}>
      <svg
        width="100%"
        height={height}
      >
        <g transform={`translate(${cx},${cy})`}>
          {arcs.map((a, i) => (
            <path
              key={i}
              d={a.path}
              fill={a.datum.color}
              opacity={0.85}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => {
                (e.target as SVGPathElement).style.opacity = "1";
                setTooltip({
                  x: cx + a.centroid[0],
                  y: cy + a.centroid[1],
                  entries: [{ label: a.datum.name, value: a.datum.value, color: a.datum.color }],
                });
              }}
              onMouseLeave={(e) => {
                (e.target as SVGPathElement).style.opacity = "0.85";
                setTooltip(null);
              }}
            />
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 4,
          fontSize: 12,
        }}
      >
        {filtered.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
            <span style={{ color: "var(--color-muted, #64748b)" }}>{d.name}</span>
          </div>
        ))}
      </div>

      {tooltip && (
        <ChartTooltip
          x={tooltip.x}
          y={tooltip.y}
          entries={tooltip.entries}
          containerRef={ref as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
}
