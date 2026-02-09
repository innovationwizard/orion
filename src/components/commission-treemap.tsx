"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  hierarchy,
  treemap,
  treemapSquarify,
  type HierarchyRectangularNode
} from "d3-hierarchy";

export type CommissionRecipient = {
  recipientId: string;
  recipientName: string;
  recipientType: "management" | "sales_rep" | "special";
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  percentPaid: number;
};

type CommissionTreemapProps = {
  data: CommissionRecipient[];
};

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

type TooltipState = {
  x: number;
  y: number;
  recipient: CommissionRecipientNode;
} | null;

type CommissionRecipientNode = CommissionRecipient & {
  name: string;
  size: number;
};

type CommissionGroup = {
  name: string;
  children: CommissionRecipientNode[];
};

function typeGroupKey(type: CommissionRecipient["recipientType"]) {
  if (type === "management") return "Management";
  if (type === "sales_rep") return "Sales";
  return "Special";
}


function CommissionTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip?.recipient?.recipientId) {
    return null;
  }
  const node = tooltip.recipient;
  return (
    <div className="treemap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <strong>{node.recipientName}</strong>
      <div className="tooltip-grid">
        <div>Total</div>
        <div>{currency.format(node.totalAmount)}</div>
        <div>Pagado</div>
        <div>{currency.format(node.paidAmount)}</div>
        <div>No pagado</div>
        <div>{currency.format(node.unpaidAmount)}</div>
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

export default function CommissionTreemap({ data }: CommissionTreemapProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const treemapData = useMemo(() => {
    const grouped = data.reduce<Record<string, CommissionRecipientNode[]>>((acc, item) => {
      const key = typeGroupKey(item.recipientType);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        ...item,
        name: item.recipientName,
        size: Math.max(1, item.totalAmount)
      });
      return acc;
    }, {});

    return ["Management", "Sales", "Special"]
      .filter((groupName) => grouped[groupName]?.length)
      .map((groupName) => ({
        name: groupName,
        children: grouped[groupName]
      })) as CommissionGroup[];
  }, [data]);

  const root = useMemo<HierarchyRectangularNode<CommissionGroup | CommissionRecipientNode>>(() => {
    const hierarchyRoot = hierarchy({
      name: "root",
      children: treemapData
    })
      .sum((node: any) => node.size ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    treemap<CommissionRecipientNode>()
      .tile(treemapSquarify)
      .size([size.width, size.height])
      .paddingOuter(6)
      .paddingInner(6)
      .paddingTop((node) => (node.depth === 1 ? 26 : 8))(hierarchyRoot as any);

    return hierarchyRoot as unknown as HierarchyRectangularNode<
      CommissionGroup | CommissionRecipientNode
    >;
  }, [size.height, size.width, treemapData]);

  return (
    <div className="treemap-wrapper">
      <div className="treemap-canvas" ref={ref} style={{ height: 360 }}>
        <svg width="100%" height="100%" role="img" aria-label="Commission distribution treemap">
          {root
            .descendants()
            .filter((node) => node.depth > 0)
            .map((node, index) => {
              const x = node.x0 ?? 0;
              const y = node.y0 ?? 0;
              const width = (node.x1 ?? 0) - x;
              const height = (node.y1 ?? 0) - y;
              const isGroup = node.depth === 1;
              const payload = node.data as CommissionRecipientNode;
              const labelVisible = width > 90 && height > 50;
              const fill = isGroup
                ? "#f1f5f9"
                : payload.paidAmount >= payload.totalAmount
                ? "#22c55e"
                : "#9ca3af";

              return (
                <g key={`${payload.name}-${index}`}>
                  <rect
                    className={isGroup ? "treemap-rect project" : "treemap-rect unit"}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={12}
                    ry={12}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                    onMouseMove={(event) => {
                      if (isGroup || !payload.recipientId) {
                        setTooltip(null);
                        return;
                      }
                      const bounds = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
                      if (!bounds) return;
                      setTooltip({
                        x: event.clientX - bounds.left + 12,
                        y: event.clientY - bounds.top + 12,
                        recipient: payload
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {labelVisible ? (
                    <text x={x + 12} y={y + 22} fontSize={13} fill="#0f172a">
                      {payload.name}
                    </text>
                  ) : null}
                  {labelVisible && !isGroup ? (
                    <text x={x + 12} y={y + 40} fontSize={12} fill="#0f172a">
                      {currency.format(payload.totalAmount)}
                    </text>
                  ) : null}
                </g>
              );
            })}
        </svg>
        <CommissionTooltip tooltip={tooltip} />
      </div>
      <div className="treemap-legend">
        <div className="legend-chip">
          <span className="legend-color paid" />
          Pagado
        </div>
        <div className="legend-chip">
          <span className="legend-color unpaid" />
          No pagado
        </div>
      </div>
    </div>
  );
}
