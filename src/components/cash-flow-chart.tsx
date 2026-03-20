"use client";

import { useMemo, useState } from "react";
import { useElementSize } from "@/hooks/use-element-size";

export type MonthlyData = {
  month: string;
  expected: number;
  forecasted: number;
  actual: number;
};

type CashFlowChartProps = {
  data: MonthlyData[];
};

const MARGIN = { top: 20, right: 20, bottom: 40, left: 64 };

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

function niceMax(value: number): number {
  if (value <= 0) return 100_000;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const m = value / exp;
  if (m <= 1) return exp;
  if (m <= 2) return 2 * exp;
  if (m <= 5) return 5 * exp;
  return 10 * exp;
}

function formatAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}


type TooltipState = { idx: number; pixelX: number } | null;

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const W = Math.max(400, size.width);
  const H = Math.max(220, Math.min(380, W * 0.42));
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;

  const maxY = useMemo(() => {
    const peak = Math.max(...data.flatMap((d) => [d.expected, d.forecasted, d.actual]), 0);
    return niceMax(peak * 1.05);
  }, [data]);

  const xAt = (i: number) =>
    MARGIN.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const yAt = (v: number) => MARGIN.top + innerH - (v / maxY) * innerH;

  const makeLine = (fn: (d: MonthlyData) => number) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(fn(d))}`).join(" ");

  const makeArea = (fn: (d: MonthlyData) => number) => {
    const line = makeLine(fn);
    const last = data.length - 1;
    return `${line} L${xAt(last)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`;
  };

  const expectedLine = makeLine((d) => d.expected);
  const forecastedLine = makeLine((d) => d.forecasted);
  const forecastedArea = makeArea((d) => d.forecasted);
  const actualLine = makeLine((d) => d.actual);
  const actualArea = makeArea((d) => d.actual);

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxY / tickCount) * i)
  );

  const monthLabels = data.map((d) => {
    const idx = parseInt(d.month.split("-")[1], 10) - 1;
    return MONTH_NAMES[idx] ?? d.month.slice(5);
  });

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const svgX = (relX / rect.width) * W;

    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(svgX - xAt(i));
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    const pixelX = (xAt(nearest) / W) * (size.width || rect.width);
    setTooltip({ idx: nearest, pixelX });
  }

  if (data.length === 0) {
    return <div className="text-center text-muted py-6">No hay datos de flujo de caja.</div>;
  }

  const hovered = tooltip ? data[tooltip.idx] : null;

  return (
    <div className="relative grid gap-3" ref={ref}>
      <svg
        className="block"
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Grafico de flujo de caja"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={MARGIN.left}
            x2={W - MARGIN.right}
            y1={yAt(tick)}
            y2={yAt(tick)}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {/* Y labels */}
        {yTicks.map((tick) => (
          <text
            key={`y-${tick}`}
            x={MARGIN.left - 8}
            y={yAt(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {formatAxis(tick)}
          </text>
        ))}

        {/* X labels */}
        {data.map((_, i) => (
          <text
            key={`x-${i}`}
            x={xAt(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {monthLabels[i]}
          </text>
        ))}

        {/* Forecasted area + line */}
        <path d={forecastedArea} fill="#3b82f6" fillOpacity={0.06} />
        <path d={forecastedLine} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6,4" />

        {/* Actual area + line */}
        <path d={actualArea} fill="#22c55e" fillOpacity={0.08} />
        <path
          d={actualLine}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expected line (dashed gray) */}
        <path d={expectedLine} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,3" />

        {/* Actual data dots */}
        {data.map((d, i) => (
          <circle key={`dot-${i}`} cx={xAt(i)} cy={yAt(d.actual)} r={3} fill="#22c55e" />
        ))}

        {/* Hover crosshair + highlight dots */}
        {tooltip && (
          <>
            <line
              x1={xAt(tooltip.idx)}
              x2={xAt(tooltip.idx)}
              y1={MARGIN.top}
              y2={MARGIN.top + innerH}
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.4}
            />
            <circle cx={xAt(tooltip.idx)} cy={yAt(data[tooltip.idx].expected)} r={3.5} fill="#94a3b8" />
            <circle cx={xAt(tooltip.idx)} cy={yAt(data[tooltip.idx].forecasted)} r={3.5} fill="#3b82f6" />
            <circle
              cx={xAt(tooltip.idx)}
              cy={yAt(data[tooltip.idx].actual)}
              r={4.5}
              fill="#22c55e"
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {/* Tooltip card */}
      {tooltip && hovered && (
        <div
          className="absolute top-2 bg-card rounded-xl shadow-card border border-border px-3.5 py-3 grid gap-1.5 text-xs text-text-primary pointer-events-none z-[10] min-w-[180px]"
          style={{
            left: tooltip.pixelX > (size.width || 400) * 0.65
              ? tooltip.pixelX - 12
              : tooltip.pixelX + 12,
            transform: tooltip.pixelX > (size.width || 400) * 0.65
              ? "translateX(-100%)"
              : "none"
          }}
        >
          <strong className="text-[13px]">
            {monthLabels[tooltip.idx]} {data[tooltip.idx].month.slice(0, 4)}
          </strong>
          <div className="grid grid-cols-[10px_1fr_auto] gap-1 gap-x-2 items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
            <span>Programado</span>
            <span>{currency.format(hovered.expected)}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span>Proyectado</span>
            <span>{currency.format(hovered.forecasted)}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>Cobrado</span>
            <span>{currency.format(hovered.actual)}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted">
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5 rounded-[1px]"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 3px, transparent 3px, transparent 6px)"
            }}
          />
          Programado
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5 rounded-[1px]"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 5px, transparent 5px, transparent 8px)"
            }}
          />
          Proyectado
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-block w-5 h-0.5 rounded-[1px] bg-green-500" />
          Cobrado
        </div>
      </div>
    </div>
  );
}
