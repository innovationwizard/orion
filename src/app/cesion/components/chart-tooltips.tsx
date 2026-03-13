import { formatCurrency } from "@/lib/reservas/constants";

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: { fill: string };
}

interface BarTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

export function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg px-3.5 py-2.5 shadow-lg">
      <div className="text-sm font-semibold text-text-primary mb-1">
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}:{" "}
          {p.dataKey === "unidades" ? p.value : formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  totalCount: number;
}

export function PieTooltip({ active, payload, totalCount }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-border rounded-lg px-3.5 py-2.5 shadow-lg">
      <div className="text-sm font-semibold text-text-primary">{d.name}</div>
      <div className="text-xs" style={{ color: d.payload.fill }}>
        {d.value} unidades ({((d.value / totalCount) * 100).toFixed(1)}%)
      </div>
    </div>
  );
}
