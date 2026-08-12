"use client";

import { useEffect, useState } from "react";
import type { HudCobrosPayload } from "@/app/api/hud/cobros/route";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

type AccountRow = HudCobrosPayload["desistCandidates"][number];

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function AccountTable({ rows, showDays }: { rows: AccountRow[]; showDays: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Proyecto</th>
            <th>Unidad</th>
            {showDays && <th>Días mora</th>}
            <th>Esperado</th>
            <th>Pagado</th>
            <th>Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.project}-${r.unit}-${i}`}>
              <td>
                {r.client}
                {r.isFF && (
                  <span className="ml-2 text-[11px] font-semibold uppercase rounded-full px-1.5 py-0.5 bg-[#7c3aed]/10 text-[#7c3aed]">
                    F&amp;F
                  </span>
                )}
              </td>
              <td>{r.project}</td>
              <td>
                <strong>{r.unit}</strong>
              </td>
              {showDays && <td className="text-danger">{r.daysDelinquent}</td>}
              <td>{money(r.esperado, r.currency)}</td>
              <td>{money(r.pagado, r.currency)}</td>
              <td>{r.compliancePct != null ? `${Math.round(r.compliancePct)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Decisiones de desistimiento (mora rankeada) y portafolio F&F.
 * Data served by /api/hud/cobros — unfiltered; the dashboard's filters do not apply here.
 */
export default function CobrosDecisiones() {
  const [data, setData] = useState<HudCobrosPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useScrollToHash(data != null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hud/cobros")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<HudCobrosPayload>;
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
      <section className="bg-card rounded-2xl p-4 shadow-card text-danger text-sm">
        No se pudo cargar decisiones de desistimiento: {error}
      </section>
    );
  }
  if (!data) {
    return (
      <section className="bg-card rounded-2xl p-4 shadow-card animate-pulse">
        <div className="grid gap-2.5 p-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded-full bg-border" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="decisiones-desistimiento" className="bg-card rounded-2xl p-4 shadow-card grid gap-2 scroll-mt-4">
        <div>
          <h2>Candidatos a desistimiento</h2>
          <p className="text-muted m-0">
            {data.desistCandidates.length} cuentas en mora, mayor atraso primero. &quot;Pagado&quot; = retención
            potencial si se desiste (sujeto a política de reembolso). Sin filtros — todos los proyectos.
          </p>
        </div>
        <AccountTable rows={data.desistCandidates} showDays />
      </section>

      <section id="casos-ff" className="bg-card rounded-2xl p-4 shadow-card grid gap-2 scroll-mt-4">
        <div>
          <h2>Portafolio F&amp;F — casos especiales</h2>
          <p className="text-muted m-0">
            {data.ffCases.length} casos especiales (caso_especial) con plan de pagos, menor cumplimiento primero.
          </p>
        </div>
        <AccountTable rows={data.ffCases} showDays={false} />
      </section>
    </>
  );
}
