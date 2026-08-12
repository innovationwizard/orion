"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import type { DescuentosPayload, DescuentoFolder } from "@/app/api/descuentos/route";

const nf = new Intl.NumberFormat("es-GT");
const money = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(n);

const TIPO_LABELS: Record<string, string> = {
  generico: "Genérico",
  pago_contado: "Pago al contado",
  family_friends: "Family & Friends",
  volumen: "Volumen",
  especial: "Especial",
  cliente_directo: "Cliente directo",
  promocion: "Promoción",
};

function BarBlock({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0);
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <span className="text-xs text-muted truncate block">{item.label}</span>
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
    </div>
  );
}

export default function DescuentosClient() {
  const [data, setData] = useState<DescuentosPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/descuentos")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<DescuentosPayload>;
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

  const filtered = useMemo(() => {
    if (!data) return [] as DescuentoFolder[];
    const q = search.trim().toLowerCase();
    return data.folders.filter(
      (f) =>
        (tipo === "todos" || f.types.includes(tipo)) &&
        (q === "" ||
          f.cliente.toLowerCase().includes(q) ||
          f.unidad.includes(q) ||
          f.partnerId.includes(q)),
    );
  }, [data, tipo, search]);

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="p-6 text-danger text-sm">No se pudo cargar descuentos: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Control de Descuentos</h1>
          <p className="text-sm text-muted mt-1">
            {data ? `${data.scope}. Extracción del ${data.extractedAt}` : "Cargando…"} — snapshot; se
            actualiza reemplazando los CSV en DESCUENTOS/ y corriendo
            scripts/extract-descuentos.py
          </p>
        </div>

        {!data ? (
          <div className="grid gap-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-border/50" />
            <div className="h-64 rounded-2xl bg-border/50" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <KpiCard label="Expedientes con descuento" value={String(data.totals.expedientes)} />
              <KpiCard
                label="Exposición máxima total"
                value={money(data.totals.exposicionMaxGtq)}
                hint="suma del monto máx. plausible por expediente"
              />
              <KpiCard
                label="Descuento promedio"
                value={money(data.totals.exposicionMaxGtq / Math.max(1, data.totals.expedientes))}
              />
              <KpiCard
                label="Expedientes descartados"
                value={String(data.totals.expedientesDescartados)}
                hint="solo ruido: recibos EEGSA, montos implausibles"
              />
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <BarBlock
                title="Expedientes por tipo de descuento"
                items={Object.entries(data.tipos).map(([t, count]) => ({
                  label: TIPO_LABELS[t] ?? t,
                  count,
                }))}
              />
              <div className="bg-warning/10 border border-warning/40 rounded-2xl p-4">
                <h2 className="text-sm font-semibold text-text-primary">Advertencias del origen</h2>
                <ul className="mt-2 grid gap-1 text-sm text-text-primary/80">
                  <li>
                    • Fuente: OCR línea por línea sobre PDFs escaneados — {data.totals.hitsTotales} hits
                    en {data.totals.expedientes + data.totals.expedientesDescartados} expedientes;{" "}
                    {data.totals.hitsDescartados} hits descartados como ruido.
                  </li>
                  <li>
                    • Recibos de luz EEGSA escaneados dentro de expedientes generan líneas
                    &quot;DESCUENTO&quot; que NO son descuentos de venta ({data.flagCounts.eegsa_bill ?? 0}{" "}
                    hits excluidos).
                  </li>
                  <li>
                    • Montos ≈ o mayores al precio total se descartaron como menciones de precio mal
                    leídas ({data.flagCounts.implausible_vs_total ?? 0} hits).
                  </li>
                  <li>
                    • {data.flagCounts.percent_only ?? 0} hits traen solo porcentaje sin monto;
                    confianza OCR entre 61.6 y 99.8. Filas con flags se marcan en la tabla.
                  </li>
                  <li>• Cobertura: solo Boulevard 5. Los demás proyectos no se han extraído.</li>
                </ul>
              </div>
            </div>

            <section className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-medium text-text-primary">
                  Expedientes ({nf.format(filtered.length)})
                </h2>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="text-sm border border-border rounded-lg px-2 py-1 bg-card"
                  aria-label="Filtrar por tipo"
                >
                  <option value="todos">Todos los tipos</option>
                  {Object.keys(data.tipos).map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABELS[t] ?? t}
                    </option>
                  ))}
                </select>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, unidad, partner id…"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card flex-1 min-w-[200px]"
                  aria-label="Buscar expedientes"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-4 py-2 font-medium">Unidad</th>
                      <th className="px-4 py-2 font-medium">Cliente (según folder)</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium text-right">Monto máx.</th>
                      <th className="px-4 py-2 font-medium text-right">%</th>
                      <th className="px-4 py-2 font-medium">Flags</th>
                      <th className="px-4 py-2 font-medium text-right">Evidencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((f) => (
                      <Fragment key={f.folder}>
                        <tr
                          className="text-text-primary cursor-pointer hover:bg-primary/[0.04]"
                          onClick={() => setOpenFolder(openFolder === f.folder ? null : f.folder)}
                        >
                          <td className="px-4 py-2 whitespace-nowrap font-semibold">{f.unidad}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{f.cliente}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {f.types.map((t) => TIPO_LABELS[t] ?? t).join(", ")}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums">
                            {money(f.maxAmountGtq)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right tabular-nums">
                            {f.percents ? `${f.percents}%` : "—"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {f.reviewFlags ? (
                              <span className="text-xs font-semibold uppercase rounded-full px-1.5 py-0.5 bg-warning/15 text-warning">
                                {f.reviewFlags}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-primary text-xs">
                            {openFolder === f.folder ? "ocultar ▲" : `${f.evidencia.length} hit${f.evidencia.length === 1 ? "" : "s"} ▼`}
                          </td>
                        </tr>
                        {openFolder === f.folder &&
                          f.evidencia.map((e, i) => (
                            <tr key={`${f.folder}-ev-${i}`} className="bg-bg/60 text-xs text-text-primary/90">
                              <td className="px-4 py-2" />
                              <td className="px-4 py-2" colSpan={4}>
                                <span className="text-muted">p.{e.page} · conf {e.conf ?? "—"} · </span>
                                &quot;{e.label}&quot;
                                <div className="text-muted mt-0.5">{e.pdf}</div>
                              </td>
                              <td className="px-4 py-2" colSpan={2}>
                                {e.amountGtq != null ? money(e.amountGtq) : "sin monto"}
                                {e.flags ? ` · ${e.flags}` : ""}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
