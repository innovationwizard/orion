"use client";

import { useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useElementSize } from "@/hooks/use-element-size";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartRow = Record<string, any>;

interface RadarChartProps {
  data: ChartRow[];
  dimensionKey: string;
  keys: string[];
  colors: Record<string, string>;
  height?: number;
}

export default function RadarChart({
  data,
  dimensionKey,
  keys,
  colors,
  height = 400,
}: RadarChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const cx = size.width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) * 0.7;

  const rScale = useMemo(
    () => scaleLinear().domain([0, 100]).range([0, radius]),
    [radius],
  );

  const dimensions = useMemo(
    () => data.map((d) => String(d[dimensionKey])),
    [data, dimensionKey],
  );

  const angleStep = (2 * Math.PI) / dimensions.length;

  // Grid rings at 20, 40, 60, 80, 100
  const rings = [20, 40, 60, 80, 100];

  // Generate polygon points for each key
  const polygons = useMemo(() => {
    return keys.map((key) => {
      const points = data.map((d, i) => {
        const value = Number(d[key] ?? 0);
        const r = rScale(value);
        const angle = i * angleStep - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      });
      return { key, points, color: colors[key] ?? "#94a3b8" };
    });
  }, [keys, data, rScale, angleStep, cx, cy, colors]);

  if (!size.width) {
    return <div ref={ref} style={{ width: "100%", height }} />;
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height }}>
      <svg width="100%" height={height}>
        {/* Grid rings */}
        {rings.map((ring) => {
          const r = rScale(ring);
          const points = dimensions.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={ring}
              points={points.join(" ")}
              fill="none"
              stroke="var(--color-border, #e2e8f0)"
              strokeOpacity={0.4}
            />
          );
        })}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke="var(--color-border, #e2e8f0)"
              strokeOpacity={0.3}
            />
          );
        })}

        {/* Dimension labels */}
        {dimensions.map((dim, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 16;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={dim}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fill="var(--color-muted, #64748b)"
            >
              {dim}
            </text>
          );
        })}

        {/* Data polygons */}
        {polygons.map((polygon) => {
          const pts = polygon.points.map((p) => `${p.x},${p.y}`).join(" ");
          const isHovered = hoveredKey === polygon.key;
          return (
            <g key={polygon.key}>
              <polygon
                points={pts}
                fill={polygon.color}
                fillOpacity={isHovered ? 0.3 : 0.12}
                stroke={polygon.color}
                strokeWidth={isHovered ? 3 : 2}
                style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                onMouseEnter={() => setHoveredKey(polygon.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
              {/* Data points */}
              {polygon.points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : 3}
                  fill={polygon.color}
                  stroke="var(--color-card, #fff)"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontSize: 12,
          marginTop: -8,
        }}
      >
        {keys.map((k) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              opacity: hoveredKey && hoveredKey !== k ? 0.5 : 1,
            }}
            onMouseEnter={() => setHoveredKey(k)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[k] ?? "#94a3b8" }} />
            <span style={{ color: "var(--color-muted, #64748b)" }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
