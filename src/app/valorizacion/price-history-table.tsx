"use client";

import type { PriceHistoryEntry } from "@/lib/reservas/types";
import { formatCurrency, formatDate } from "@/lib/reservas/constants";

type Props = {
  entries: PriceHistoryEntry[];
  onDelete: (id: string) => void;
  currency?: "GTQ" | "USD";
};

export default function PriceHistoryTable({ entries, onDelete, currency }: Props) {
  return (
    <section className="bg-card rounded-2xl shadow-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Fecha</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Proyecto</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Torre</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Und. restantes</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Incremento</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">% Inc.</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Precio prom.</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Aprec. total</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Notas</th>
            <th className="py-3 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.id}
              className="border-b border-border/50 hover:bg-bg/50 transition-colors"
            >
              <td className="py-2 px-4 font-medium">{formatDate(e.effective_date)}</td>
              <td className="py-2 px-3">{e.project_name}</td>
              <td className="py-2 px-3">{e.tower_name ?? "—"}</td>
              <td className="py-2 px-3 text-right tabular-nums">{e.units_remaining}</td>
              <td className="py-2 px-3 text-right tabular-nums text-success">
                {formatCurrency(e.increment_amount, currency)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {e.increment_pct != null ? `${e.increment_pct}%` : "—"}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {formatCurrency(e.new_price_avg, currency)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums font-semibold">
                {formatCurrency(e.appreciation_total, currency)}
              </td>
              <td className="py-2 px-3 text-muted max-w-[200px] truncate">
                {e.notes ?? "—"}
              </td>
              <td className="py-2 px-3">
                <button
                  type="button"
                  className="text-xs text-danger hover:underline"
                  onClick={() => onDelete(e.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
