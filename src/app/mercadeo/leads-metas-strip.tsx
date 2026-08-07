"use client";

import { useEffect, useState } from "react";
import type { LeadsMetasPayload } from "@/app/api/mercadeo/leads-metas/route";

const nf = new Intl.NumberFormat("es-GT");

const STATUS_UI = {
  debajo: { label: "Debajo del rango", cls: "bg-danger/10 text-danger border-danger/40" },
  dentro: { label: "Dentro del rango", cls: "bg-success/10 text-success border-success/40" },
  encima: { label: "Encima del rango", cls: "bg-primary/10 text-primary border-primary/40" },
  sin_meta: { label: "Sin meta", cls: "bg-muted/10 text-muted border-border" },
} as const;

export default function LeadsMetasStrip() {
  const [data, setData] = useState<LeadsMetasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mercadeo/leads-metas")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: LeadsMetasPayload) => {
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
        Metas de leads no disponibles: {error}
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border px-4 py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Metas de leads{data ? ` · ${data.month}` : ""}
        </span>
        {data ? (
          <>
            {data.proyectos.map((p) => {
              const ui = STATUS_UI[p.status];
              return (
                <span key={p.project} className="inline-flex items-center gap-2 text-sm">
                  <span className="text-text-primary font-medium">{p.project}</span>
                  <span className="tabular-nums text-muted">
                    {nf.format(p.leads)}
                    {p.min != null && p.max != null
                      ? ` / ${nf.format(p.min)}–${nf.format(p.max)}`
                      : ""}
                    {` (≈${Math.round(p.leadsPorDia)}/día${
                      p.minPorDia != null && p.maxPorDia != null
                        ? `, meta ≈${Math.round(p.minPorDia)}–${Math.round(p.maxPorDia)}/día`
                        : ""
                    })`}
                  </span>
                  <span className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${ui.cls}`}>
                    {ui.label}
                  </span>
                </span>
              );
            })}
            <span className="basis-full text-center text-[11px] text-muted">
              Rangos mensuales &quot;saludables&quot; del equipo de mercadeo (2026-08-07). Leads del
              último mes completo del snapshot, netos de la campaña excluida por auditoría.
            </span>
          </>
        ) : (
          <span className="text-sm text-muted animate-pulse">Cargando…</span>
        )}
      </div>
    </div>
  );
}
