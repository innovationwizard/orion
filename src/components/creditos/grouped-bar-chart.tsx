"use client";

import { useMemo, useState } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { useElementSize } from "@/hooks/use-element-size";
import ChartTooltip, { type TooltipEntry } from "./chart-tooltip";
import { fmtNum } from "@/lib/creditos/helpers";
import { fmtQCompact } from "@/lib/reservas/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartRow = Record<string, any>;

interface GroupedBarChartProps {
  data: ChartRow[];
  keys: string[];
  xKey: string;
  colors: Record<string, string>;
  layout?: "vertical" | "horizontal";
  height?: number;
  isCurrency?: boolean;
}

const V_MARGIN = { top: 8, right: 12, bottom: 40, left: 48 };
const H_MARGIN = { top: 8, right: 20, bottom: 24, left: 120 };

export default function GroupedBarChart({
  data,
  keys,
  xKey,
  colors,
  layout = "vertical",
  height = 280,
  isCurrency = false,
}: GroupedBarChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    entries: TooltipEntry[];
  } | null>(null);

  const margin = layout === "horizontal" ? H_MARGIN : V_MARGIN;
  const chartW = Math.max(0, size.width - margin.left - margin.right);
  const chartH = Math.max(0, height - margin.top - margin.bottom);

  const maxVal = useMemo(() => {
    let max = 0;
    for (const d of data) {
      for (const k of keys) {
        const v = Number(d[k] ?? 0);
        if (v > max) max = v;
      }
    }
    return max || 1;
  }, [data, keys]);

  const labels = useMemo(() => data.map((d) => String(d[xKey])), [data, xKey]);

  // VERTICAL layout
  const xBand = useMemo(
    () => scaleBand().domain(labels).range([0, chartW]).padding(0.2),
    [labels, chartW],
  );
  const innerBand = useMemo(
    () => scaleBand().domain(keys).range([0, xBand.bandwidth()]).padding(0.05),
    [keys, xBand],
  );
  const yLinear = useMemo(
    () => scaleLinear().domain([0, maxVal]).range([chartH, 0]).nice(),
    [maxVal, chartH],
  );

  // HORIZONTAL layout
  const yBand = useMemo(
    () => scaleBand().domain(labels).range([0, chartH]).padding(0.2),
    [labels, chartH],
  );
  const innerBandH = useMemo(
    () => scaleBand().domain(keys).range([0, yBand.bandwidth()]).padding(0.05),
    [keys, yBand],
  );
  const xLinear = useMemo(
    () => scaleLinear().domain([0, maxVal]).range([0, chartW]).nice(),
    [maxVal, chartW],
  );

  if (!size.width) {
    return <div ref={ref} style={{ width: "100%", height }} />;
  }

  const formatVal = isCurrency ? fmtQCompact : (v: number | null | undefined) => fmtNum(Number(v ?? 0));

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height }}>
      <svg width="100%" height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {layout === "vertical" ? (
            <>
              {/* Gridlines */}
              {yLinear.ticks(5).map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={chartW}
                  y1={yLinear(tick)}
                  y2={yLinear(tick)}
                  stroke="var(--color-border, #e2e8f0)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              ))}
              {/* Bars */}
              {data.map((d, i) =>
                keys.map((k) => {
                  const val = Number(d[k] ?? 0);
                  const barX = (xBand(labels[i]) ?? 0) + (innerBand(k) ?? 0);
                  const barY = yLinear(val);
                  const barH = chartH - barY;
                  return (
                    <rect
                      key={`${i}-${k}`}
                      x={barX}
                      y={barY}
                      width={innerBand.bandwidth()}
                      height={Math.max(0, barH)}
                      fill={colors[k] ?? "#94a3b8"}
                      rx={3}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => {
                        setTooltip({
                          x: barX + innerBand.bandwidth() / 2 + margin.left,
                          y: barY + margin.top,
                          title: labels[i],
                          entries: keys.map((kk) => ({
                            label: kk,
                            value: Number(d[kk] ?? 0),
                            color: colors[kk] ?? "#94a3b8",
                          })),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                }),
              )}
              {/* X axis */}
              {labels.map((label) => (
                <text
                  key={label}
                  x={(xBand(label) ?? 0) + xBand.bandwidth() / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-muted, #64748b)"
                >
                  {label.length > 14 ? label.slice(0, 12) + "…" : label}
                </text>
              ))}
              {/* Y axis */}
              {yLinear.ticks(5).map((tick) => (
                <text key={tick} x={-8} y={yLinear(tick) + 4} textAnchor="end" fontSize={10} fill="var(--color-muted, #64748b)">
                  {isCurrency ? formatVal(tick) : tick}
                </text>
              ))}
            </>
          ) : (
            <>
              {/* Horizontal gridlines */}
              {xLinear.ticks(5).map((tick) => (
                <line
                  key={tick}
                  x1={xLinear(tick)}
                  x2={xLinear(tick)}
                  y1={0}
                  y2={chartH}
                  stroke="var(--color-border, #e2e8f0)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              ))}
              {/* Horizontal bars */}
              {data.map((d, i) =>
                keys.map((k) => {
                  const val = Number(d[k] ?? 0);
                  const barY = (yBand(labels[i]) ?? 0) + (innerBandH(k) ?? 0);
                  const barW = xLinear(val);
                  return (
                    <rect
                      key={`${i}-${k}`}
                      x={0}
                      y={barY}
                      width={Math.max(0, barW)}
                      height={innerBandH.bandwidth()}
                      fill={colors[k] ?? "#94a3b8"}
                      rx={3}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => {
                        setTooltip({
                          x: barW + margin.left,
                          y: barY + innerBandH.bandwidth() / 2 + margin.top,
                          title: labels[i],
                          entries: keys.map((kk) => ({
                            label: kk,
                            value: Number(d[kk] ?? 0),
                            color: colors[kk] ?? "#94a3b8",
                          })),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                }),
              )}
              {/* Y axis labels (horizontal mode) */}
              {labels.map((label) => (
                <text
                  key={label}
                  x={-8}
                  y={(yBand(label) ?? 0) + yBand.bandwidth() / 2 + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-muted, #64748b)"
                >
                  {label.length > 16 ? label.slice(0, 14) + "…" : label}
                </text>
              ))}
              {/* X axis labels (horizontal mode) */}
              {xLinear.ticks(5).map((tick) => (
                <text
                  key={tick}
                  x={xLinear(tick)}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-muted, #64748b)"
                >
                  {isCurrency ? formatVal(tick) : tick}
                </text>
              ))}
            </>
          )}
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
          isCurrency={isCurrency}
          containerRef={ref as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
}
