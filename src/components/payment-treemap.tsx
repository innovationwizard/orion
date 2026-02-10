"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  hierarchy,
  treemap,
  treemapSquarify,
  type HierarchyRectangularNode
} from "d3-hierarchy";

export type PaymentAnalyticsUnit = {
  unitId: string;
  unitNumber: string;
  clientName: string;
  totalExpected: number;
  totalPaid: number;
  percentPaid: number;
  engancheTotal: { expected: number; paid: number };
  reserve: { expected: number; paid: number };
  downPayment: { expected: number; paid: number };
  installments: { expected: number; paid: number };
  paymentHistory: Array<{
    id: string;
    paymentDate: string;
    paymentType: string;
    amount: number;
  }>;
};

export type PaymentAnalyticsProject = {
  projectId: string;
  projectName: string;
  units: PaymentAnalyticsUnit[];
};

type TreemapNode = PaymentAnalyticsUnit & {
  name: string;
  size: number;
};

type PaymentTreemapProps = {
  data: PaymentAnalyticsProject[];
  onUnitSelect: (unit: PaymentAnalyticsUnit) => void;
};

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(start: string, end: string, t: number) {
  const a = hexToRgb(start);
  const b = hexToRgb(end);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bVal = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bVal);
}

function getPaymentColor(percentPaid: number) {
  const clamped = Math.min(100, Math.max(0, percentPaid));
  if (clamped <= 50) {
    return lerpColor("#ef4444", "#fbbf24", clamped / 50);
  }
  return lerpColor("#fbbf24", "#22c55e", (clamped - 50) / 50);
}

type TooltipState = {
  x: number;
  y: number;
  unit: TreemapNode;
} | null;

function PaymentTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip?.unit?.unitId) {
    return null;
  }
  const node = tooltip.unit;
  return (
    <div className="treemap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <strong>{node.unitNumber}</strong>
      <span className="muted">{node.clientName}</span>
      <div className="tooltip-grid">
        <div>Enganche total</div>
        <div>
          {currency.format(node.engancheTotal.expected)} · {currency.format(node.engancheTotal.paid)}
        </div>
        <div>Reserva</div>
        <div>
          {currency.format(node.reserve.expected)} · {currency.format(node.reserve.paid)}
        </div>
        <div>Enganche fraccionado</div>
        <div>
          {currency.format(node.downPayment.expected)} · {currency.format(node.downPayment.paid)}
        </div>
        <div>Cuotas</div>
        <div>
          {currency.format(node.installments.expected)} · {currency.format(node.installments.paid)}
        </div>
        <div>Total</div>
        <div>
          {currency.format(node.totalExpected)} · {currency.format(node.totalPaid)}
        </div>
      </div>
    </div>
  );
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export default function PaymentTreemap({ data, onUnitSelect }: PaymentTreemapProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const root = useMemo<HierarchyRectangularNode<TreemapNode>>(() => {
    const hierarchyRoot = hierarchy({
      name: "root",
      children: data.map((project) => ({
        name: project.projectName,
        children: project.units.map((unit) => ({
          ...unit,
          name: unit.unitNumber,
          size: Math.max(1, unit.totalExpected)
        }))
      }))
    })
      .sum((node: any) => node.size ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    treemap<TreemapNode>()
      .tile(treemapSquarify)
      .size([size.width, size.height])
      .paddingOuter(6)
      .paddingInner(6)
      .paddingTop((node) => (node.depth === 1 ? 28 : 8))(hierarchyRoot as any);

    return hierarchyRoot as unknown as HierarchyRectangularNode<TreemapNode>;
  }, [data, size.height, size.width]);

  return (
    <div className="treemap-wrapper">
      <div className="treemap-canvas" ref={ref}>
        <svg width="100%" height="100%" role="img" aria-label="Payment tracking treemap">
          {root
            .descendants()
            .filter((node) => node.depth > 0)
            .map((node, index) => {
              const x = node.x0 ?? 0;
              const y = node.y0 ?? 0;
              const width = (node.x1 ?? 0) - x;
              const height = (node.y1 ?? 0) - y;
              const isProject = node.depth === 1;
              const payload = node.data as TreemapNode;
              const hasRoomForPercent = width > 90 && height > 55;
              const fill = isProject ? "#f1f5f9" : getPaymentColor(payload.percentPaid ?? 0);
              // Always show apto/project name; scale font down for small blocks (min 6px)
              const fontSize = Math.max(6, Math.min(13, Math.min(width, height) / 4));
              const isTiny = width < 50 || height < 36;
              const textX = isTiny ? x + width / 2 : x + 12;
              const textY = isTiny ? y + height / 2 : y + 22;

              return (
                <g key={`${payload.name}-${index}`}>
                  <rect
                    className={isProject ? "treemap-rect project" : "treemap-rect unit"}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={12}
                    ry={12}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                    onClick={() => {
                      if (!isProject && payload.unitId) {
                        onUnitSelect(payload);
                      }
                    }}
                    onMouseMove={(event) => {
                      if (isProject || !payload.unitId) {
                        setTooltip(null);
                        return;
                      }
                      const bounds = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
                      if (!bounds) return;
                      setTooltip({
                        x: event.clientX - bounds.left + 12,
                        y: event.clientY - bounds.top + 12,
                        unit: payload
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <text
                    x={textX}
                    y={textY}
                    fontSize={fontSize}
                    fill="#0f172a"
                    textAnchor={isTiny ? "middle" : "start"}
                    dominantBaseline={isTiny ? "middle" : "auto"}
                  >
                    {payload.name}
                  </text>
                  {hasRoomForPercent && !isProject ? (
                    <text x={x + 12} y={y + 40} fontSize={12} fill="#0f172a">
                      {payload.percentPaid ?? 0}% pagado
                    </text>
                  ) : null}
                </g>
              );
            })}
        </svg>
        <PaymentTooltip tooltip={tooltip} />
      </div>
      <div className="treemap-legend">
        <span>0%</span>
        <div className="legend-gradient" />
        <span>100%</span>
      </div>
    </div>
  );
}
