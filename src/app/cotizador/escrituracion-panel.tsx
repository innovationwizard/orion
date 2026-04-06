"use client";

import type { EscrituracionResult, CotizadorConfig } from "@/lib/reservas/cotizador";
import { LOCALE } from "@/lib/reservas/constants";

/** Always show 2 decimals for escrituracion amounts. */
function fmt(amount: number, currency?: "GTQ" | "USD"): string {
  const symbol = currency === "USD" ? "$" : "Q";
  return `${symbol}${amount.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Props = {
  result: EscrituracionResult;
  config: CotizadorConfig;
};

export default function EscrituracionPanel({ result, config }: Props) {
  const hasTimbres = result.timbres_acciones > 0;

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Escrituración</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Concepto</th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Sin impuestos</th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {hasTimbres ? "Impuestos" : "IVA"}
              </th>
              <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Con impuestos</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 px-2">Inmueble ({Math.round(result.pct_inmueble * 100)}%)</td>
              <td className="py-2 px-2 text-right">{fmt(result.valor_inmueble_sin_iva, config.currency)}</td>
              <td className="py-2 px-2 text-right text-warning">
                {fmt(result.iva_inmueble, config.currency)}
                <span className="text-[10px] text-muted ml-1">IVA 12%</span>
              </td>
              <td className="py-2 px-2 text-right font-medium">{fmt(result.valor_inmueble_con_iva, config.currency)}</td>
            </tr>
            {result.pct_acciones > 0 && (
              <tr className="border-b border-border/50">
                <td className="py-2 px-2">Acciones ({Math.round(result.pct_acciones * 100)}%)</td>
                <td className="py-2 px-2 text-right">{fmt(result.valor_acciones, config.currency)}</td>
                <td className="py-2 px-2 text-right text-warning">
                  {hasTimbres ? (
                    <>
                      {fmt(result.timbres_acciones, config.currency)}
                      <span className="text-[10px] text-muted ml-1">Timbres {Math.round(config.timbres_rate * 100)}%</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 px-2 text-right font-medium">{fmt(result.valor_acciones_con_timbres, config.currency)}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="py-2 px-2">Total</td>
              <td className="py-2 px-2 text-right">{fmt(result.total_sin_impuesto, config.currency)}</td>
              <td className="py-2 px-2 text-right text-warning">
                {fmt(result.iva_inmueble + result.timbres_acciones, config.currency)}
              </td>
              <td className="py-2 px-2 text-right">{fmt(result.total_con_impuesto, config.currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
