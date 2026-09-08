"use client";

import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useElementSize } from "@/hooks/use-element-size";

export type BarDatum = {
  /** Category name — nominal, so every bar wears the same hue. */
  label: string;
  value: number;
  /** Optional second line in the tooltip, e.g. "223 de 296 tratos". */
  detail?: string;
  /**
   * The category exists but the measure was never recorded. Rendered as
   * "Data no existe", never as a zero — a Q0 bar reads as "no money", which is a
   * different and wrong claim.
   */
  noData?: boolean;
};

type HorizontalBarChartProps = {
  data: BarDatum[];
  /** Formats the value at the bar tip and in the tooltip. */
  format?: (value: number) => string;
  /** Appends "· NN%" of the summed total to each tip label. */
  showShare?: boolean;
  /** Shown in place of the plot when `data` is empty or every value is zero. */
  emptyMessage?: string;
  /** Reserved width for category labels. Long funnel names need more. */
  labelWidth?: number;
};

const ROW_H = 30;
const BAR_H = 14; // ≤24px: the band keeps its leftover as air
const RADIUS = 4; // rounded data-end, square at the baseline
const MARGIN = { top: 6, right: 4, bottom: 22 };
/** Approx advance width of 12px Inter semibold digits — enough to reserve the
 *  gutter so a tip label never runs past the panel edge. */
const TIP_CHAR_W = 7.2;
const TIP_GAP = 8;
/** Approx advance width of 12px Inter regular, for the category column. */
const LABEL_CHAR_W = 6.6;

const SIN_DATO = "Data no existe";

const numberFmt = new Intl.NumberFormat("es-GT");
const defaultFormat = (v: number) => numberFmt.format(v);

/**
 * Single-series horizontal bars for magnitude across nominal categories —
 * money by bank, deals by stage, deals by owner.
 *
 * One hue for every bar on purpose: the categories (banks, owners, projects)
 * have no natural order, so shading them by size would double-encode the length
 * the bar already shows and burn the only free channel. Ordering is the
 * caller's, never re-sorted here — a stage funnel must stay in funnel order
 * even though that is not descending by value.
 */
export default function HorizontalBarChart({
  data,
  format = defaultFormat,
  showShare = false,
  emptyMessage = "Data no existe",
  labelWidth = 172,
}: HorizontalBarChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const max = useMemo(() => data.reduce((m, d) => Math.max(m, d.value), 0), [data]);

  /** The tip label sits outside the bar, so the gutter must fit the longest one
   *  — a fixed width clips "Q95,311,692 · 63%" on a full-length bar. */
  const tipFor = useMemo(() => {
    const sum = total;
    return (d: BarDatum) => {
      if (d.noData) return SIN_DATO;
      const base = format(d.value);
      if (!showShare || sum <= 0) return base;
      return `${base} · ${Math.round((d.value / sum) * 100)}%`;
    };
  }, [format, showShare, total]);

  const valueW = useMemo(() => {
    const longest = data.reduce((m, d) => Math.max(m, tipFor(d).length), 0);
    return Math.max(64, Math.ceil(longest * TIP_CHAR_W) + TIP_GAP + 4);
  }, [data, tipFor]);

  /** Truncate to what the reserved label column actually fits, so a wider
   *  `labelWidth` really does show more of the name. */
  const maxLabelChars = Math.max(8, Math.floor((labelWidth - 10) / LABEL_CHAR_W));

  const trackW = Math.max(0, size.width - labelWidth - valueW - MARGIN.right);
  const plotH = data.length * ROW_H;
  const height = plotH + MARGIN.top + MARGIN.bottom;

  const x = useMemo(
    () => scaleLinear().domain([0, max > 0 ? max : 1]).range([0, trackW]),
    [max, trackW],
  );

  // Clean tick values — they carry the magnitudes not spelled out at the tips.
  const ticks = useMemo(() => (trackW > 160 ? x.ticks(4) : x.ticks(2)), [x, trackW]);

  if (data.length === 0 || max <= 0) {
    return (
      <div
        className="grid place-items-center gap-1 rounded-xl border border-dashed border-warning/50 bg-warning/5 px-4 py-8 text-center"
        role="status"
      >
        <span aria-hidden="true" className="text-base leading-none">
          &#9888;
        </span>
        <span className="text-sm font-medium text-text-primary">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative w-full">
      {size.width > 0 ? (
        <svg width="100%" height={height} role="img" aria-label={`Gráfico de barras, ${data.length} categorías`}>
          {/* Recessive hairline grid, solid — never dashed */}
          {ticks.map((t) => (
            <line
              key={t}
              x1={labelWidth + x(t)}
              x2={labelWidth + x(t)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotH}
              stroke="var(--color-border)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          ))}

          {data.map((d, i) => {
            const y = MARGIN.top + i * ROW_H;
            const barY = y + (ROW_H - BAR_H) / 2;
            const w = d.noData ? 0 : x(d.value);
            const tip = tipFor(d);
            return (
              <g
                key={d.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                className="outline-none"
              >
                {/* Hit target spans the whole row, not just the mark */}
                <rect
                  x={0}
                  y={y}
                  width={Math.max(size.width, 1)}
                  height={ROW_H}
                  fill={hover === i ? "var(--color-bg)" : "transparent"}
                />
                <text
                  x={0}
                  y={y + ROW_H / 2}
                  dominantBaseline="middle"
                  fill="var(--color-muted, #64748b)"
                  fontSize={12}
                >
                  {d.label.length > maxLabelChars
                    ? `${d.label.slice(0, maxLabelChars - 1)}…`
                    : d.label}
                  <title>{d.label}</title>
                </text>
                <rect
                  x={labelWidth}
                  y={barY}
                  width={Math.max(w, w > 0 ? 2 : 0)}
                  height={BAR_H}
                  rx={RADIUS}
                  fill="var(--color-primary)"
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
                {/* Square off the baseline end that rx just rounded */}
                {w > RADIUS ? (
                  <rect
                    x={labelWidth}
                    y={barY}
                    width={RADIUS}
                    height={BAR_H}
                    fill="var(--color-primary)"
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                ) : null}
                {/* Value at the tip, outside the bar — text never wears the data color */}
                <text
                  x={labelWidth + w + TIP_GAP}
                  y={y + ROW_H / 2}
                  dominantBaseline="middle"
                  fill={
                    d.noData
                      ? "var(--color-warning, #f59e0b)"
                      : "var(--color-text-primary, #0f172a)"
                  }
                  fontSize={12}
                  fontWeight={600}
                  style={{ fontVariantNumeric: d.noData ? "normal" : "tabular-nums" }}
                >
                  {tip}
                </text>
              </g>
            );
          })}

          {/* Axis ticks carry what the tips don't */}
          {ticks.map((t) => (
            <text
              key={`tick-${t}`}
              x={labelWidth + x(t)}
              y={MARGIN.top + plotH + 14}
              textAnchor="middle"
              fill="var(--color-muted, #64748b)"
              fontSize={10}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {numberFmt.format(t)}
            </text>
          ))}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {hover !== null && data[hover] ? (
        <div
          className="pointer-events-none absolute left-0 z-10 rounded-lg border border-border bg-card px-3 py-2 shadow-card"
          style={{ top: MARGIN.top + hover * ROW_H + ROW_H }}
          role="tooltip"
        >
          <div className="text-xs font-semibold text-text-primary">{data[hover].label}</div>
          <div
            className={`text-xs ${data[hover].noData ? "text-warning font-medium" : "text-text-primary"}`}
            style={{ fontVariantNumeric: data[hover].noData ? "normal" : "tabular-nums" }}
          >
            {tipFor(data[hover])}
          </div>
          {data[hover].detail ? (
            <div className="mt-0.5 text-xs text-muted">{data[hover].detail}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
