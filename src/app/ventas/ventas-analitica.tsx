"use client";

import type { HudVentasPayload } from "@/app/api/hud/ventas/route";

/**
 * Presentational sections for the sales analytics block. The
 * `/api/hud/ventas` fetch lives in the host page (see `useHudVentas`) so
 * objetivos, canales, modelos and promociones share one request instead of
 * issuing four identical ones now that they render on the same page.
 */

/** Per-salesperson meta vs ventas, with déficit/excedente. */
export function ObjetivosPorAsesor({ objetivos }: { objetivos: HudVentasPayload["objetivos"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border">
            <th className="py-2 px-3 font-medium">Asesor</th>
            <th className="py-2 px-3 font-medium">Proyecto</th>
            <th className="py-2 px-3 font-medium text-right">Meta</th>
            <th className="py-2 px-3 font-medium text-right">Ventas</th>
            <th className="py-2 px-3 font-medium text-right">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {objetivos.asesores.map((a, i) => (
            <tr key={`${a.asesor}-${a.project}-${i}`} className="text-text-primary">
              <td className="py-2 px-3 whitespace-nowrap">
                {a.asesor}
                {a.sinAsignacion && <span className="ml-2 text-xs text-warning">sin asignación activa</span>}
              </td>
              <td className="py-2 px-3 whitespace-nowrap">{a.project}</td>
              <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">{a.meta}</td>
              <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">{a.ventas}</td>
              <td
                className={`py-2 px-3 whitespace-nowrap text-right tabular-nums font-semibold ${
                  a.delta > 0 ? "text-success" : a.delta < 0 ? "text-danger" : "text-text-primary"
                }`}
              >
                {a.delta > 0 ? `+${a.delta}` : a.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
