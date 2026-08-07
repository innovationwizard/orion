"use client";

import { useEffect, useState } from "react";
import type { MercadeoRoasPayload } from "@/app/api/mercadeo/roas/route";

const money = (n: number, currency = "GTQ") =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const x = (n: number) => `${n >= 100 ? Math.round(n) : n.toFixed(1)}x`;

export default function RoasStrip() {
  const [data, setData] = useState<MercadeoRoasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mercadeo/roas")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<MercadeoRoasPayload>;
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .then((d: MercadeoRoasPayload) => {
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
      <div className="bg-card border-b border-border px-4 py-2 text-sm text-danger">
        ROAS no disponible: {error}
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border px-4 py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">ROAS / ROI</span>
        {data ? (
          <>
            <span className="text-sm">
              <span className="text-muted">Inversión</span>{" "}
              <span className="font-bold tabular-nums text-text-primary">{money(data.global.spendGtq)}</span>
            </span>
            <span className="text-sm">
              <span className="text-muted">Ventas</span>{" "}
              <span className="font-bold tabular-nums text-text-primary">{money(data.global.revenueGtq)}</span>
            </span>
            <span className="text-sm">
              <span className="text-muted">ROAS amplio</span>{" "}
              <span className="font-bold tabular-nums text-success">{x(data.global.roasAmplio)}</span>
            </span>
            <span className="text-sm">
              <span className="text-muted">ROAS atribuido (fuentes digitales)</span>{" "}
              <span className="font-bold tabular-nums text-primary">{x(data.global.roasAtribuido)}</span>
            </span>
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-primary underline underline-offset-2 cursor-pointer"
            >
              {open ? "Ocultar detalle" : "Ver por proyecto"}
            </button>

            {open && (
              <div className="basis-full overflow-x-auto mt-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-2 py-1 font-medium">Proyecto</th>
                      <th className="px-2 py-1 font-medium text-right">Inversión</th>
                      <th className="px-2 py-1 font-medium text-right">Ventas (#)</th>
                      <th className="px-2 py-1 font-medium text-right">Revenue</th>
                      <th className="px-2 py-1 font-medium text-right">ROAS amplio</th>
                      <th className="px-2 py-1 font-medium text-right">ROAS atribuido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.proyectos.map((p) => (
                      <tr key={p.project} className="text-text-primary">
                        <td className="px-2 py-1 whitespace-nowrap">
                          {p.project}
                          {p.flag && (
                            <span className="ml-1 text-[11px] text-warning" title={p.flag}>
                              ⚠
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-right tabular-nums">
                          {money(p.spendNative, p.spendCurrency)}
                          {p.spendCurrency === "USD" && (
                            <span className="text-muted"> ({money(p.spendGtq)})</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {p.ventas}
                          {p.ventasAtribuidas > 0 && <span className="text-muted"> ({p.ventasAtribuidas} dig.)</span>}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-right tabular-nums">
                          {p.revenueGtq != null ? money(p.revenueGtq) : "—"}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {p.roasAmplio != null ? x(p.roasAmplio) : "—"}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {p.roasAtribuido != null ? x(p.roasAtribuido) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <span className="basis-full text-center text-[11px] text-muted">
              Período {data.period.from} → {data.period.to}. Gasto por cuenta en su divisa real (columna
              Divisa del export — el reporte Power BI mezcla GTQ y USD). Conversión fija Q{data.gtqPerUsd}/USD.
              Revenue = ventas no canceladas (sales). Atribuido = unidades cuya reserva tiene fuente digital.
            </span>
          </>
        ) : (
          <span className="text-sm text-muted animate-pulse">Cargando…</span>
        )}
      </div>
    </div>
  );
}
