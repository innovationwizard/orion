"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import type { HudCumplimientoPayload, ExpedienteRow } from "@/app/api/hud/cumplimiento/route";

const nf = new Intl.NumberFormat("es-GT");

const DPI_LABELS: Record<string, string> = {
  VIGENTE: "Vigente",
  VENCIDO: "Vencido",
  FECHA_ABSURDA: "Fecha absurda",
  SIN_FECHA: "Sin fecha",
};
const DPI_CLS: Record<string, string> = {
  VIGENTE: "text-success",
  VENCIDO: "text-danger",
  FECHA_ABSURDA: "text-warning",
  SIN_FECHA: "text-muted",
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

export default function CumplimientoClient() {
  const [data, setData] = useState<HudCumplimientoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dpiFilter, setDpiFilter] = useState<string>("todos");
  const [soloObs, setSoloObs] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hud/cumplimiento")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<HudCumplimientoPayload>;
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

  const { bancos, fuentes } = useMemo(() => {
    const bancos = new Map<string, number>();
    const fuentes = new Map<string, number>();
    for (const e of data?.expedientes ?? []) {
      if (e.bancoPrecalificacion) bancos.set(e.bancoPrecalificacion, (bancos.get(e.bancoPrecalificacion) ?? 0) + 1);
      for (const f of e.fuenteIngresos) fuentes.set(f, (fuentes.get(f) ?? 0) + 1);
    }
    const sorted = (m: Map<string, number>) =>
      [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    return { bancos: sorted(bancos), fuentes: sorted(fuentes) };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [] as ExpedienteRow[];
    const q = search.trim().toLowerCase();
    return data.expedientes.filter(
      (e) =>
        (dpiFilter === "todos" || e.clientes.some((c) => c.dpiStatus === dpiFilter)) &&
        (!soloObs || e.observaciones.length > 0) &&
        (q === "" ||
          e.apto.toLowerCase().includes(q) ||
          (e.vendedor ?? "").toLowerCase().includes(q) ||
          (e.bancoPrecalificacion ?? "").toLowerCase().includes(q) ||
          e.clientes.some((c) => c.nombre.toLowerCase().includes(q))),
    );
  }, [data, dpiFilter, soloObs, search]);

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="p-6 text-danger text-sm">No se pudo cargar cumplimiento: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expedientes de Cumplimiento</h1>
          <p className="text-sm text-muted mt-1">
            Base del oficial de cumplimiento — {data?.proyectos.join(", ") ?? "…"} · snapshot estático;
            se actualiza reemplazando el xlsx y regenerando con scripts/extract-cumplimiento-expedientes.py
          </p>
        </div>

        {!data ? (
          <div className="grid gap-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-border/50" />
            <div className="h-64 rounded-2xl bg-border/50" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <KpiCard label="Expedientes" value={nf.format(data.totalExpedientes)} />
              <KpiCard label="Compradores" value={nf.format(data.totalCompradores)} />
              <KpiCard label="DPI vigentes" value={nf.format(data.dpi.VIGENTE ?? 0)} positive hint="al corte" />
              <KpiCard label="DPI vencidos" value={nf.format(data.dpi.VENCIDO ?? 0)} negative />
              <KpiCard
                label="DPI fecha absurda"
                value={nf.format(data.dpi.FECHA_ABSURDA ?? 0)}
                negative
                hint="dato erróneo en el origen"
              />
              <KpiCard label="Promesas firmadas" value={`${data.conPromesa}/${data.totalExpedientes}`} />
              <KpiCard
                label="Fuente de ingresos"
                value={`${data.conFuenteIngresos}/${data.totalExpedientes}`}
                hint="declarada"
              />
              <KpiCard label="Con observaciones" value={nf.format(data.conObservaciones)} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <BarBlock
                title="Status de DPI por comprador"
                items={Object.entries(data.dpi).map(([k, count]) => ({ label: DPI_LABELS[k] ?? k, count }))}
              />
              <BarBlock title="Banco de precalificación" items={bancos} />
              <BarBlock title="Fuente de ingresos declarada" items={fuentes} />
            </div>

            <div className="bg-warning/10 border border-warning/40 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary">Advertencias del origen</h2>
              <ul className="mt-2 grid gap-1">
                {data.notas.map((n, i) => (
                  <li key={i} className="text-sm text-text-primary/80">
                    • {n}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-medium text-text-primary">
                  Expedientes ({nf.format(filtered.length)})
                </h2>
                <div className="flex gap-1 flex-wrap">
                  {["todos", "VENCIDO", "FECHA_ABSURDA", "SIN_FECHA", "VIGENTE"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setDpiFilter(s)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                        dpiFilter === s
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:border-primary"
                      }`}
                    >
                      {s === "todos" ? "Todos" : `DPI ${DPI_LABELS[s]}`}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer">
                  <input type="checkbox" checked={soloObs} onChange={(e) => setSoloObs(e.target.checked)} />
                  Solo con observaciones
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, apto, vendedor, banco…"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card flex-1 min-w-[200px]"
                  aria-label="Buscar expedientes"
                />
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-4 py-2 font-medium">Apto</th>
                      <th className="px-4 py-2 font-medium">Compradores — status DPI</th>
                      <th className="px-4 py-2 font-medium">Vendedor</th>
                      <th className="px-4 py-2 font-medium">Promesa</th>
                      <th className="px-4 py-2 font-medium">Fuente ingresos</th>
                      <th className="px-4 py-2 font-medium">Precalificación</th>
                      <th className="px-4 py-2 font-medium">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((e, i) => (
                      <tr key={`${e.apto}-${i}`} className="text-text-primary align-top">
                        <td className="px-4 py-2 whitespace-nowrap">{e.apto}</td>
                        <td className="px-4 py-2">
                          {e.clientes.length === 0
                            ? "—"
                            : e.clientes.map((c, j) => (
                                <div key={j} className="whitespace-nowrap">
                                  {c.nombre}{" "}
                                  <span className={`text-xs ${DPI_CLS[c.dpiStatus] ?? ""}`}>
                                    · DPI {DPI_LABELS[c.dpiStatus] ?? c.dpiStatus}
                                    {c.rtu ? ` · RTU ${c.rtu}` : ""}
                                  </span>
                                </div>
                              ))}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{e.vendedor ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{e.promesaFecha ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {e.fuenteIngresos.length > 0 ? e.fuenteIngresos.join(", ") : "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {e.bancoPrecalificacion ?? "—"}
                          {e.fha ? " · FHA" : ""}
                          {e.contado ? " · Contado" : ""}
                        </td>
                        <td className="px-4 py-2 max-w-[360px]">
                          {e.observaciones.length > 0 ? (
                            <ul className="grid gap-0.5">
                              {e.observaciones.map((o, k) => (
                                <li key={k} className="text-xs text-text-primary/80">
                                  • {o}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
