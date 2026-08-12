"use client";

import { useEffect, useState } from "react";
import type { HudVentasPayload } from "@/app/api/hud/ventas/route";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

const nf = new Intl.NumberFormat("es-GT");

function BarListCard({
  id,
  title,
  subtitle,
  items,
}: {
  id: string;
  title: string;
  subtitle: string;
  items: Array<{ label: string; count: number }>;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0);
  return (
    <section id={id} className="bg-card rounded-2xl shadow-card border border-border p-4 grid gap-2 scroll-mt-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-muted m-0">{subtitle}</p>
      </div>
      <ul className="grid gap-2 list-none p-0 m-0">
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <span className="text-sm text-text-primary truncate block">{item.label}</span>
              <div className="mt-1 h-2 rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: max > 0 ? `${(item.count / max) * 100}%` : "0%" }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{nf.format(item.count)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Objetivos, canales y modelos — data served by /api/hud/ventas (all projects;
 * the page's project filter does not apply here).
 */
export default function VentasAnalitica() {
  const [data, setData] = useState<HudVentasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  useScrollToHash(data != null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hud/ventas")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<HudVentasPayload>;
        // Rol sin acceso a analítica (ej. ventas): la sección se oculta, no es un error
        if (r.status === 401 || r.status === 403) return null;
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .then((d) => {
        if (cancelled) return;
        if (d === null) setForbidden(true);
        else setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (forbidden) return null;
  if (error) {
    return (
      <section className="bg-card rounded-2xl shadow-card border border-border p-4 text-danger text-sm">
        No se pudo cargar objetivos y canales: {error}
      </section>
    );
  }
  if (!data) {
    return (
      <section className="bg-card rounded-2xl shadow-card border border-border p-6 animate-pulse">
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-border" />
          ))}
        </div>
      </section>
    );
  }

  const o = data.objetivos;

  return (
    <>
      {/* Objetivos: metas del mes por proyecto y por asesor, con déficit/excedente */}
      <section id="objetivos" className="bg-card rounded-2xl shadow-card border border-border p-4 grid gap-4 scroll-mt-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Metas del mes {o.month} — por proyecto</h2>
          <p className="text-sm text-muted m-0">
            Cuentan reservas confirmadas y desistidas por fecha de depósito. Meta del proyecto = meta por
            asesor × asesores activos (sin roles de gerencia). Todos los proyectos — el filtro de la página
            no aplica aquí.
          </p>
        </div>
        <ul className="grid gap-3 list-none p-0 m-0">
          {o.proyectos.map((p) => {
            const pct = p.metaTotal > 0 ? Math.min(100, (p.ventas / p.metaTotal) * 100) : 0;
            return (
              <li key={p.project} className="grid gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-text-primary">
                    {p.project}
                    <span className="ml-2 text-xs text-muted">
                      {p.asesoresActivos} asesores × {p.metaPorAsesor}
                      {p.entrega ? ` · entrega ${p.entrega}` : ""}
                    </span>
                  </span>
                  {p.metaTotal > 0 ? (
                    <span className="text-sm tabular-nums">
                      <span className="text-text-primary">
                        {p.ventas} / {p.metaTotal}
                      </span>
                      <span className={`ml-2 font-semibold ${p.delta >= 0 ? "text-success" : "text-danger"}`}>
                        {p.delta >= 0 ? `+${p.delta} excedente` : `${p.delta} déficit`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm tabular-nums text-muted">{p.ventas} ventas · sin meta</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.metaTotal > 0 && p.delta < 0 ? "bg-danger/80" : "bg-success/80"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

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
              {o.asesores.map((a, i) => (
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
      </section>

      <BarListCard
        id="canales"
        title="Ventas por canal"
        subtitle="Reservas confirmadas por lead_source — histórico completo, todos los proyectos"
        items={data.canales.map((c) => ({ label: c.canal, count: c.count }))}
      />

      <BarListCard
        id="modelos"
        title="Split por modelo"
        subtitle="Unidades reservadas y vendidas por proyecto y modelo — todos los proyectos"
        items={data.modelos.map((m) => ({ label: `${m.project} — ${m.modelo}`, count: m.count }))}
      />
    </>
  );
}
