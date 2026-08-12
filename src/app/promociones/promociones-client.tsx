"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import type { HudVentasPayload } from "@/app/api/hud/ventas/route";

function money(amount: number): string {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export default function PromocionesClient() {
  const [data, setData] = useState<HudVentasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const v = data?.vales;

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <header>
        <h1 className="text-2xl font-bold text-text-primary">Promociones — Vales</h1>
        <p className="text-sm text-muted mt-1">
          {v
            ? `${v.scope} Export de Pipedrive del ${v.exportedAt} — snapshot; se actualiza reemplazando el export.`
            : "Vales activos desde el export de tratos de Pipedrive"}
        </p>
      </header>

      {error ? (
        <div className="bg-card rounded-2xl border border-border p-4 text-danger text-sm">
          No se pudo cargar los vales: {error}
        </div>
      ) : !v ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <KpiCard label="Tratos con vale" value={String(v.dealCount)} />
            <KpiCard label="Exposición total en vales" value={money(v.totalVales)} />
            <KpiCard label="Vale promedio" value={money(v.dealCount > 0 ? v.totalVales / v.dealCount : 0)} />
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
                {v.rows.map((r, i) => (
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
      )}
    </div>
  );
}
