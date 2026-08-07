"use client";

import { useEffect, useState } from "react";
import type { MercadeoFunnelPayload } from "@/app/api/mercadeo/funnel/route";

const nf = new Intl.NumberFormat("es-GT");

function Stage({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center px-4">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold tabular-nums text-text-primary">{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function Arrow({ pct }: { pct: number }) {
  return (
    <div className="text-center px-2 self-center">
      <div className="text-sm font-semibold tabular-nums text-primary">
        {pct >= 10 ? Math.round(pct) : pct.toFixed(pct >= 1 ? 1 : 2)}%
      </div>
      <div className="text-muted" aria-hidden>
        →
      </div>
    </div>
  );
}

export default function FunnelStrip() {
  const [data, setData] = useState<MercadeoFunnelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mercadeo/funnel")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: MercadeoFunnelPayload) => {
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
        Funnel de conversión no disponible: {error}
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border px-4 py-2">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wide pr-3">
          Funnel de conversión
        </span>
        {data ? (
          <>
            <Stage label="Leads (pauta Meta)" value={nf.format(data.leads)} />
            <Arrow pct={data.tasaLeadReserva} />
            <Stage label="Reservas" value={nf.format(data.reservas)} />
            <Arrow pct={data.tasaReservaPcv} />
            <Stage label="PCV firmadas" value={nf.format(data.pcvFirmadas)} />
            <span className="basis-full text-center text-[11px] text-muted mt-1">
              Período {data.period.from} → {data.period.to}. Leads = pauta Meta (snapshot, excluye
              campaña con columna mal mapeada); reservas y PCV = todas las fuentes, desde la base de
              datos.
            </span>
          </>
        ) : (
          <span className="text-sm text-muted animate-pulse">Cargando…</span>
        )}
      </div>
    </div>
  );
}
