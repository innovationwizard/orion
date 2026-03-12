"use client";

import type { ReferralFull } from "@/lib/reservas/types";
import { formatCurrency, formatDate } from "@/lib/reservas/constants";

type Props = {
  referrals: ReferralFull[];
  onDelete: (id: string) => void;
};

export default function ReferralTable({ referrals, onDelete }: Props) {
  return (
    <section className="bg-card rounded-2xl shadow-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Proyecto</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Torre</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Unidad</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Cliente</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Referido por</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Precio lista</th>
            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Precio referido</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Fecha</th>
            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Asesor</th>
            <th className="py-3 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => {
            const discount =
              r.precio_lista && r.precio_referido
                ? r.precio_lista - r.precio_referido
                : null;
            return (
              <tr
                key={r.id}
                className="border-b border-border/50 hover:bg-bg/50 transition-colors"
              >
                <td className="py-2 px-4 font-medium">{r.project_name}</td>
                <td className="py-2 px-3">{r.tower_name}</td>
                <td className="py-2 px-3">{r.unit_number}</td>
                <td className="py-2 px-3">{r.client_name}</td>
                <td className="py-2 px-3">{r.referido_por}</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCurrency(r.precio_lista)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCurrency(r.precio_referido)}
                  {discount != null && discount > 0 && (
                    <span className="ml-1 text-xs text-success">
                      (-{formatCurrency(discount)})
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">{formatDate(r.fecha_reserva)}</td>
                <td className="py-2 px-3">{r.salesperson_name ?? "—"}</td>
                <td className="py-2 px-3">
                  <button
                    type="button"
                    className="text-xs text-danger hover:underline"
                    onClick={() => onDelete(r.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
