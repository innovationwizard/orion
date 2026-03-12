"use client";

import type { EscrituracionResult } from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  result: EscrituracionResult;
  inmueblePct: number;
  onInmueblePctChange: (pct: number) => void;
};

export default function EscrituracionPanel({ result, inmueblePct, onInmueblePctChange }: Props) {
  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Escrituracion</h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted text-xs">Inmueble</span>
          <select
            className="px-2 py-1 rounded border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={inmueblePct}
            onChange={(e) => onInmueblePctChange(Number(e.target.value))}
          >
            <option value={0.6}>60 / 40</option>
            <option value={0.7}>70 / 30</option>
            <option value={0.8}>80 / 20</option>
            <option value={1.0}>100 / 0</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Concepto</th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Sin impuestos</th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">IVA</th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Con impuestos</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 px-2">Inmueble ({Math.round(result.pct_inmueble * 100)}%)</td>
              <td className="py-2 px-2 text-right">{formatCurrency(result.valor_inmueble_sin_iva)}</td>
              <td className="py-2 px-2 text-right text-warning">{formatCurrency(result.iva_inmueble)}</td>
              <td className="py-2 px-2 text-right font-medium">{formatCurrency(result.valor_inmueble_con_iva)}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 px-2">Acciones ({Math.round(result.pct_acciones * 100)}%)</td>
              <td className="py-2 px-2 text-right">{formatCurrency(result.valor_acciones)}</td>
              <td className="py-2 px-2 text-right text-muted">—</td>
              <td className="py-2 px-2 text-right font-medium">{formatCurrency(result.valor_acciones)}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-2 px-2">Total</td>
              <td className="py-2 px-2 text-right">{formatCurrency(result.total_sin_impuesto)}</td>
              <td className="py-2 px-2 text-right text-warning">{formatCurrency(result.iva_inmueble)}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(result.total_con_impuesto)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
