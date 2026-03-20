"use client";

import { useMemo, useState } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { stack as d3Stack } from "d3-shape";
import { useElementSize } from "@/hooks/use-element-size";
import ChartTooltip, { type TooltipEntry } from "./chart-tooltip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartRow = Record<string, any>;

interface StackedBarChartProps {
  data: ChartRow[];
  keys: string[];
  xKey: string;
  colors: Record<string, string>;
  height?: number;
}

const MARGIN = { top: 8, right: 12, bottom: 40, left: 40 };

export default function StackedBarChart({
  data,
  keys,
  xKey,
  colors,
  height = 280,
}: StackedBarChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    entries: TooltipEntry[];
  } | null>(null);

  const chartW = Math.max(0, size.width - MARGIN.left - MARGIN.right);
  const chartH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const stacked = useMemo(() => {
    const gen = d3Stack<Record<string, unknown>>().keys(keys);
    return gen(data);
  }, [data, keys]);

  const xScale = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => String(d[xKey])))
        .range([0, chartW])
        .padding(0.3),
    [data, xKey, chartW],
  );

  const yMax = useMemo(() => {
    let max = 0;
    for (const layer of stacked) {
      for (const d of layer) {
        if (d[1] > max) max = d[1];
      }
    }
    return max || 1;
  }, [stacked]);

  const yScale = useMemo(
    () => scaleLinear().domain([0, yMax]).range([chartH, 0]).nice(),
    [yMax, chartH],
  );

  if (!size.width) {
    return <div ref={ref} style={{ width: "100%", height }} />;
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height }}>
      <svg width="100%" height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Y gridlines */}
          {yScale.ticks(5).map((tick) => (
            <line
              key={tick}
              x1={0}
              x2={chartW}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--color-border, #e2e8f0)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}

          {/* Bars */}
          {stacked.map((layer) =>
            layer.map((d, i) => {
              const barX = xScale(String(data[i][xKey])) ?? 0;
              const barY = yScale(d[1]);
              const barH = yScale(d[0]) - yScale(d[1]);
              const isTop = layer === stacked[stacked.length - 1];
              return (
                <rect
                  key={`${layer.key}-${i}`}
                  x={barX}
                  y={barY}
                  width={xScale.bandwidth()}
                  height={Math.max(0, barH)}
                  fill={colors[layer.key] ?? "#94a3b8"}
                  rx={isTop ? 3 : 0}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => {
                    const entries: TooltipEntry[] = keys.map((k) => ({
                      label: k,
                      value: Number(data[i][k] ?? 0),
                      color: colors[k] ?? "#94a3b8",
                    }));
                    setTooltip({
                      x: barX + xScale.bandwidth() / 2 + MARGIN.left,
                      y: barY + MARGIN.top,
                      title: String(data[i][xKey]),
                      entries,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            }),
          )}

          {/* X axis labels */}
          {xScale.domain().map((label) => (
            <text
              key={label}
              x={(xScale(label) ?? 0) + xScale.bandwidth() / 2}
              y={chartH + 16}
              textAnchor="middle"
              fontSize={11}
              fill="var(--color-muted, #64748b)"
            >
              {label.length > 14 ? label.slice(0, 12) + "…" : label}
            </text>
          ))}

          {/* Y axis labels */}
          {yScale.ticks(5).map((tick) => (
            <text
              key={tick}
              x={-8}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-muted, #64748b)"
            >
              {tick}
            </text>
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontSize: 12,
          marginTop: -4,
        }}
      >
        {keys.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[k] ?? "#94a3b8" }} />
            <span style={{ color: "var(--color-muted, #64748b)" }}>{k}</span>
          </div>
        ))}
      </div>

      {tooltip && (
        <ChartTooltip
          x={tooltip.x}
          y={tooltip.y}
          title={tooltip.title}
          entries={tooltip.entries}
          containerRef={ref as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
}
