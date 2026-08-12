"use client";

import { useEffect, useState } from "react";
import type { HudVentasPayload } from "@/app/api/hud/ventas/route";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums text-text-primary">{value}</div>
    </div>
  );
}

/**
 * Desistimientos (reembolsos/retención) y trazabilidad de unidades desistidas.
 * Data served by /api/hud/ventas (all projects; the page's project filter does not apply here).
 */
export default function DesistimientosSections() {
  const [data, setData] = useState<HudVentasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useScrollToHash(data != null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hud/ventas")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<HudVentasPayload>;
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="bg-card rounded-2xl border border-border p-4 text-danger text-sm">
        No se pudo cargar desistimientos: {error}
      </section>
    );
  }
  if (!data) {
    return (
      <section className="bg-card rounded-2xl border border-border p-6 animate-pulse">
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-border" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Reembolsos y retención sobre ventas canceladas */}
      <section id="desistimientos" className="bg-card rounded-2xl border border-border p-4 grid gap-3 scroll-mt-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Desistimientos — reembolsos y retención</h2>
          <p className="text-sm text-muted m-0">
            Pagos sobre ventas canceladas, por moneda del proyecto. Todos los proyectos — el filtro de la
            página no aplica aquí.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Reservas desistidas" value={String(data.reembolsos.desistedReservations)} />
          <StatTile label="Ventas canceladas" value={String(data.reembolsos.cancelledSales)} />
        </div>
        {data.reembolsos.porMoneda.map((m) => (
          <div key={m.currency} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatTile label={`Pagado antes de desistir (${m.currency})`} value={money(m.totalPagado, m.currency)} />
            <StatTile label={`Reembolsado (${m.currency})`} value={money(m.totalReembolsado, m.currency)} />
            <StatTile label={`Retención (${m.currency})`} value={money(m.retencion, m.currency)} />
          </div>
        ))}
      </section>

      {/* Trazabilidad: cada reserva desistida → estado actual y precio lista de la unidad */}
      <section id="trazabilidad" className="bg-card rounded-2xl border border-border p-4 grid gap-3 scroll-mt-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Trazabilidad de unidades desistidas</h2>
          <p className="text-sm text-muted m-0">
            {data.desistidos.length} reservas desistidas trazadas al estado actual y precio de lista de la
            unidad. La evolución de precios por proyecto vive arriba en esta misma página.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 px-3 font-medium">Unidad</th>
                <th className="py-2 px-3 font-medium">Proyecto</th>
                <th className="py-2 px-3 font-medium">Fecha desist.</th>
                <th className="py-2 px-3 font-medium">Estado actual</th>
                <th className="py-2 px-3 font-medium text-right">Precio lista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.desistidos.map((d, i) => (
                <tr key={`${d.project}-${d.unit}-${i}`} className="text-text-primary">
                  <td className="py-2 px-3 whitespace-nowrap font-medium">{d.unit}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{d.project}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{d.fecha ?? "—"}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{d.estadoActual}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                    {d.precioLista != null ? money(d.precioLista, d.currency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
