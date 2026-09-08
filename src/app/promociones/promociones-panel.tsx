"use client";

import KpiCard from "@/components/kpi-card";
import type { HudVentasPayload } from "@/app/api/hud/ventas/route";

function money(amount: number): string {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(
    amount,
  );
}

/** Provenance caption for the vales snapshot. */
export function promocionesScopeCaption(vales: HudVentasPayload["vales"] | undefined): string {
  return vales
    ? `${vales.scope} Export de Pipedrive del ${vales.exportedAt} — snapshot; se actualiza reemplazando el export.`
    : "Vales activos desde el export de tratos de Pipedrive";
}

type PromocionesPanelProps = {
  vales: HudVentasPayload["vales"] | undefined;
  error?: string | null;
};

/**
 * Presentational only — the `/api/hud/ventas` fetch is owned by the host page
 * so objetivos, canales, modelos and promociones share a single request.
 */
export default function PromocionesPanel({ vales, error }: PromocionesPanelProps) {
  if (error) {
    return <div className="text-danger text-sm">No se pudo cargar los vales: {error}</div>;
  }

  if (!vales) {
    return (
      <div className="grid gap-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-border" />
        ))}
      </div>
    );
  }

  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <KpiCard label="Tratos con vale" value={String(vales.dealCount)} />
        <KpiCard label="Exposición total en vales" value={money(vales.totalVales)} />
        <KpiCard
          label="Vale promedio"
          value={money(vales.dealCount > 0 ? vales.totalVales / vales.dealCount : 0)}
        />
      </section>

      <section className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-3 px-4 font-medium">Cliente</th>
              <th className="py-3 px-3 font-medium">Apto</th>
              <th className="py-3 px-3 font-medium text-right">Valor trato</th>
              <th className="py-3 px-3 font-medium text-right">Vale</th>
              <th className="py-3 px-3 font-medium">Asesor</th>
              <th className="py-3 px-3 font-medium">Creado</th>
              <th className="py-3 px-3 font-medium">Cierre prev.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {vales.rows.map((r, i) => (
              <tr key={`${r.apartamento}-${i}`} className="text-text-primary">
                <td className="py-2 px-4 whitespace-nowrap">
                  {r.cliente}
                  {r.flag && (
                    <span
                      className="ml-2 text-xs font-semibold uppercase rounded-full px-1.5 py-0.5 bg-warning/15 text-warning"
                      title={r.flag}
                    >
                      ⚠ dato inconsistente
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">{r.apartamento}</td>
                <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">{money(r.valorTrato)}</td>
                <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">{money(r.vale)}</td>
                <td className="py-2 px-3 whitespace-nowrap">{r.propietario}</td>
                <td className="py-2 px-3 whitespace-nowrap">{r.creado}</td>
                <td className="py-2 px-3 whitespace-nowrap">{r.cierrePrevista}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
