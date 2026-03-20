"use client";

import { formatCurrency } from "@/lib/reservas/constants";
import { fmtNum } from "@/lib/creditos/helpers";

export interface TooltipEntry {
  label: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  x: number;
  y: number;
  title?: string;
  entries: TooltipEntry[];
  isCurrency?: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function ChartTooltip({
  x,
  y,
  title,
  entries,
  isCurrency = false,
  containerRef,
}: ChartTooltipProps) {
  if (entries.length === 0) return null;

  // Flip tooltip to the left if near right edge
  const containerWidth = containerRef.current?.clientWidth ?? 800;
  const flipX = x > containerWidth * 0.65;

  return (
    <div
      style={{
        position: "absolute",
        left: flipX ? undefined : x + 12,
        right: flipX ? containerWidth - x + 12 : undefined,
        top: y - 10,
        background: "var(--color-card, #fff)",
        border: "1px solid var(--color-border, #e2e8f0)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        pointerEvents: "none",
        zIndex: 50,
        minWidth: 120,
      }}
    >
      {title && (
        <div style={{ color: "var(--color-muted, #64748b)", marginBottom: 6, fontSize: 11 }}>
          {title}
        </div>
      )}
      {entries.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--color-text-secondary, #475569)" }}>{entry.label}:</span>
          <span
            style={{
              color: "var(--color-text-primary, #0f172a)",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 500,
            }}
          >
            {isCurrency ? formatCurrency(entry.value) : fmtNum(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
