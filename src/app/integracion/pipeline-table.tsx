"use client";

import { useMemo } from "react";
import type { IntegrationRow } from "@/lib/reservas/types";

type Props = {
  rows: IntegrationRow[];
};

const COLUMNS = [
  { key: "available", label: "Disponible", color: "bg-success/15 text-success" },
  { key: "soft_hold", label: "En revision", color: "bg-warning/15 text-warning" },
  { key: "reserved", label: "Reservado", color: "bg-primary/15 text-primary" },
  { key: "frozen", label: "Congelado", color: "bg-[#a855f7]/15 text-[#a855f7]" },
  { key: "sold", label: "Vendido", color: "bg-muted/15 text-muted" },
  { key: "confirmed_current_month", label: "PCV este mes", color: "" },
  { key: "confirmed_previous", label: "PCV anterior", color: "" },
  { key: "desisted_total", label: "Desistidos", color: "bg-danger/15 text-danger" },
] as const;

export default function PipelineTable({ rows }: Props) {
  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, IntegrationRow[]>();
    for (const r of rows) {
      const key = r.project_slug;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([slug, towers]) => ({
      slug,
      name: towers[0].project_name,
      towers,
      totals: towers.reduce(
        (acc, t) => {
          for (const col of COLUMNS) {
            (acc as Record<string, number>)[col.key] =
              ((acc as Record<string, number>)[col.key] ?? 0) + (t[col.key as keyof IntegrationRow] as number);
          }
          acc.total += t.total;
          return acc;
        },
        { total: 0, available: 0, soft_hold: 0, reserved: 0, frozen: 0, sold: 0, confirmed_current_month: 0, confirmed_previous: 0, desisted_total: 0 },
      ),
    }));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted">
        No hay datos de integracion.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Torre</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {col.label}
              </th>
            ))}
            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Total</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((group) => (
            <>
              {/* Project header */}
              <tr key={`header-${group.slug}`} className="bg-bg">
                <td colSpan={COLUMNS.length + 2} className="py-2 px-4 font-bold text-text-primary">
                  {group.name}
                </td>
              </tr>
              {/* Tower rows */}
              {group.towers.map((tower) => (
                <tr key={tower.tower_id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="py-2 px-4 font-medium">{tower.tower_name}</td>
                  {COLUMNS.map((col) => {
                    const val = tower[col.key as keyof IntegrationRow] as number;
                    return (
                      <td key={col.key} className="py-2 px-3 text-center">
                        {val > 0 ? (
                          <span className={`inline-block min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold ${col.color}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center font-semibold">{tower.total}</td>
                </tr>
              ))}
              {/* Project subtotal */}
              <tr key={`total-${group.slug}`} className="border-b border-border bg-bg/30 font-semibold">
                <td className="py-2 px-4 text-muted">Subtotal</td>
                {COLUMNS.map((col) => {
                  const val = (group.totals as Record<string, number>)[col.key] ?? 0;
                  return (
                    <td key={col.key} className="py-2 px-3 text-center">
                      {val > 0 ? val : "–"}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center">{group.totals.total}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
