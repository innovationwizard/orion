"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteNav from "@/components/site-nav";
import KpiCard from "@/components/kpi-card";
import HorizontalBarChart, { type BarDatum } from "@/components/charts/horizontal-bar-chart";
import type { CreditosPipelinePayload, PipelineDeal } from "@/app/api/creditos/pipeline/route";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

const nf = new Intl.NumberFormat("es-GT");
const qf = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 0 });

/** Quetzales, no cents — the board never shows a fraction of a quetzal. */
function fmtQ(n: number): string {
  return `Q${qf.format(n)}`;
}

const ESTADO_LABELS: Record<string, string> = {
  open: "Abiertos",
  lost: "Perdidos",
  won: "Ganados",
  todos: "Todos",
};

const SIN_DATO = "Data no existe";

/** Counts by key, ordered high→low. Used for the nominal breakdowns. */
function countBy(deals: PipelineDeal[], key: (d: PipelineDeal) => string | null): BarDatum[] {
  const map = new Map<string, number>();
  for (const d of deals) {
    const k = key(d);
    if (k === null) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Sums `montoPrestamo` by key. Deals with no declared amount are excluded from
 *  the sum and counted separately so the gap is visible, never imputed. */
function sumMontoBy(
  deals: PipelineDeal[],
  key: (d: PipelineDeal) => string | null,
): { bars: BarDatum[]; sinDato: number } {
  const map = new Map<string, { total: number; con: number; n: number }>();
  let sinDato = 0;
  for (const d of deals) {
    const k = key(d);
    if (k === null) continue;
    let entry = map.get(k);
    if (!entry) {
      entry = { total: 0, con: 0, n: 0 };
      map.set(k, entry);
    }
    entry.n += 1;
    if (d.montoPrestamo != null) {
      entry.total += d.montoPrestamo;
      entry.con += 1;
    } else {
      sinDato += 1;
    }
  }
  const bars = [...map.entries()]
    .map(([label, e]) => ({
      label,
      value: e.total,
      // No deal in this group declared an amount. That is missing data, not a
      // zero — a Q0 bar would claim the bank/project owes us nothing.
      noData: e.con === 0,
      detail:
        e.con === 0
          ? `Ninguno de los ${nf.format(e.n)} tratos tiene Monto de préstamo registrado`
          : `${nf.format(e.con)} de ${nf.format(e.n)} tratos con monto declarado`,
    }))
    .sort((a, b) => Number(a.noData) - Number(b.noData) || b.value - a.value);
  return { bars, sinDato };
}

function Panel({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-card rounded-2xl border border-border p-4 scroll-mt-4">
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      {subtitle ? <p className="text-xs text-muted mt-0.5">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A date cell, or an em dash when Pipedrive never recorded the milestone. */
function Fecha({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted">—</span>;
  return <span className="tabular-nums">{value}</span>;
}

export default function PipelineClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CreditosPipelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proyecto, setProyecto] = useState<string>(searchParams.get("proyecto") ?? "todos");
  const [embudo, setEmbudo] = useState<string>(searchParams.get("embudo") ?? "todos");
  const [etapa, setEtapa] = useState<string>(searchParams.get("etapa") ?? "todas");
  const [estado, setEstado] = useState<string>(searchParams.get("estado") ?? "open");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  useScrollToHash(data != null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/creditos/pipeline")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<CreditosPipelinePayload>;
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

  // Stage catalog comes from the export, so a Pipedrive restructure lands via a
  // regenerated snapshot instead of a code edit.
  const etapasCatalogo = data?.etapasCatalogoGlobal ?? [];

  /** Everything the project/state/stage filters select. Every KPI and chart below
   *  is computed from this, so the project filter drives the whole page. */
  const filteredDeals = useMemo(() => {
    if (!data) return [] as PipelineDeal[];
    const q = search.trim().toLowerCase();
    return data.deals.filter(
      (d) =>
        (proyecto === "todos" || d.proyecto === proyecto) &&
        (embudo === "todos" || d.embudo === embudo) &&
        (etapa === "todas" || d.etapa === etapa) &&
        (estado === "todos" || d.estado === estado) &&
        (q === "" ||
          d.titulo.toLowerCase().includes(q) ||
          (d.apartamento ?? "").toLowerCase().includes(q) ||
          (d.banco ?? "").toLowerCase().includes(q) ||
          (d.propietario ?? "").toLowerCase().includes(q)),
    );
  }, [data, proyecto, embudo, etapa, estado, search]);

  const resumen = useMemo(() => {
    const conMonto = filteredDeals.filter((d) => d.montoPrestamo != null);
    const total = conMonto.reduce((s, d) => s + (d.montoPrestamo ?? 0), 0);
    return {
      total,
      conMonto: conMonto.length,
      sinMonto: filteredDeals.length - conMonto.length,
      aprobadosBanco: filteredDeals.filter((d) => d.aprobacionBanco === true).length,
      aprobadosFHA: filteredDeals.filter((d) => d.aprobacionFHA === true).length,
      suspendidos: filteredDeals.filter((d) => d.suspendidoFHA || d.suspendidoBanco).length,
      vencidos: filteredDeals.filter(
        (d) => d.estado === "open" && d.cierrePrevista != null && d.cierrePrevista < (data?.boundary ?? ""),
      ).length,
    };
  }, [filteredDeals, data]);

  const montoPorBanco = useMemo(() => sumMontoBy(filteredDeals, (d) => d.banco), [filteredDeals]);
  /** Money that has an amount but no bank recorded, so it cannot appear in the
   *  per-bank breakdown. Without this the bank chart silently totals less than
   *  the hero figure. */
  const montoSinBanco = useMemo(() => {
    const huerfanos = filteredDeals.filter((d) => d.montoPrestamo != null && !d.banco);
    return {
      tratos: huerfanos.length,
      total: huerfanos.reduce((s, d) => s + (d.montoPrestamo ?? 0), 0),
    };
  }, [filteredDeals]);
  const montoPorProyecto = useMemo(
    () => sumMontoBy(filteredDeals, (d) => d.proyecto),
    [filteredDeals],
  );
  const bancoCounts = useMemo(() => countBy(filteredDeals, (d) => d.banco), [filteredDeals]);
  const tipoCounts = useMemo(() => countBy(filteredDeals, (d) => d.tipoCredito), [filteredDeals]);
  const propietarioCounts = useMemo(
    () => countBy(filteredDeals, (d) => d.propietario ?? "Sin propietario"),
    [filteredDeals],
  );

  /** Stage counts in funnel order — not re-sorted by size, the sequence is the point. */
  const etapaCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of filteredDeals) map.set(d.etapa, (map.get(d.etapa) ?? 0) + 1);
    return etapasCatalogo.map((nombre) => ({ label: nombre, value: map.get(nombre) ?? 0 }));
  }, [filteredDeals, etapasCatalogo]);

  /** Per-project rollup, always across all projects regardless of the filter, so
   *  the finance lead can see where the data gaps are. */
  const porProyecto = useMemo(() => {
    if (!data) return [];
    const base = data.deals.filter(
      (d) => (estado === "todos" || d.estado === estado) && (etapa === "todas" || d.etapa === etapa),
    );
    const map = new Map<string, { n: number; con: number; total: number; bancos: Set<string> }>();
    for (const p of data.proyectos) map.set(p, { n: 0, con: 0, total: 0, bancos: new Set() });
    for (const d of base) {
      const e = map.get(d.proyecto);
      if (!e) continue;
      e.n += 1;
      if (d.montoPrestamo != null) {
        e.con += 1;
        e.total += d.montoPrestamo;
      }
      if (d.banco) e.bancos.add(d.banco);
    }
    return [...map.entries()]
      .map(([nombre, e]) => ({ nombre, ...e, bancos: e.bancos.size }))
      .sort((a, b) => b.total - a.total || b.n - a.n);
  }, [data, estado, etapa]);

  const etapasSinUso = useMemo(() => {
    if (!data) return [];
    const conTratos = new Set(data.deals.map((d) => d.etapa));
    return etapasCatalogo.filter((nombre) => !conTratos.has(nombre));
  }, [data, etapasCatalogo]);

  const etapasPorEmbudo = useMemo(() => {
    if (!data) return [];
    return data.etapasPorEmbudo.filter((r) => proyecto === "todos" || r.proyecto === proyecto);
  }, [data, proyecto]);

  const embudos = useMemo(
    () =>
      data
        ? [...new Set(data.deals.filter((d) => proyecto === "todos" || d.proyecto === proyecto).map((d) => d.embudo))].sort()
        : [],
    [data, proyecto],
  );

  const alcance = estado === "todos" ? "todos los tratos" : (ESTADO_LABELS[estado] ?? estado).toLowerCase();
  const alcanceProyecto = proyecto === "todos" ? "todos los proyectos" : proyecto;

  if (error) {
    return (
      <div>
        <SiteNav />
        <div className="p-6 text-danger text-sm">No se pudo cargar el pipeline: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <SiteNav />
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pipeline de Expedientes de Crédito</h1>
          <p className="text-sm text-muted mt-1">
            Pipedrive al {data?.boundary ?? "…"} — corte de la extracción, no la fecha del archivo
            {data?.fechaExport ? ` (exportado el ${data.fechaExport})` : ""}. Se actualiza colocando
            el nuevo export y regenerando con scripts/extract-creditos-pipedrive.py
          </p>
        </div>

        {!data ? (
          <div className="grid gap-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-border/50" />
            <div className="h-64 rounded-2xl bg-border/50" />
          </div>
        ) : (
          <>
            {/* Filters in one row above the charts — they drive every figure below */}
            <div className="bg-card rounded-2xl border border-border p-4 grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wide">Proyecto</span>
                <button
                  onClick={() => {
                    setProyecto("todos");
                    setEmbudo("todos");
                  }}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    proyecto === "todos"
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-primary hover:border-primary"
                  }`}
                >
                  Todos
                </button>
                {data.proyectos.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setProyecto(p);
                      setEmbudo("todos");
                    }}
                    className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                      proyecto === p
                        ? "bg-primary text-white border-primary"
                        : "border-border text-text-primary hover:border-primary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1">
                  {["open", "lost", "won", "todos"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setEstado(s)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                        estado === s
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:border-primary"
                      }`}
                    >
                      {ESTADO_LABELS[s] ?? "Todos"}
                    </button>
                  ))}
                </div>
                <select
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value)}
                  className="text-sm border border-border rounded-lg px-2 py-1 bg-card"
                  aria-label="Filtrar por etapa"
                >
                  <option value="todas">Todas las etapas</option>
                  {etapasCatalogo.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <select
                  value={embudo}
                  onChange={(e) => setEmbudo(e.target.value)}
                  className="text-sm border border-border rounded-lg px-2 py-1 bg-card"
                  aria-label="Filtrar por embudo"
                >
                  <option value="todos">Todos los embudos</option>
                  {embudos.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, apto, banco, propietario…"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card flex-1 min-w-[220px]"
                  aria-label="Buscar tratos"
                />
              </div>
            </div>

            {/* Hero: the one number this page leads with */}
            <div className="bg-card rounded-2xl border border-border p-5 grid gap-1">
              <h2 className="text-sm font-medium text-muted">
                Monto a recibir de los bancos — {alcanceProyecto}, {alcance}
              </h2>
              {/* A Q0 here would claim "no money coming", when the truth is that
                  nobody captured the amount. Say which one it is. */}
              <strong
                className={`text-[clamp(32px,6vw,52px)] leading-tight font-semibold ${
                  resumen.conMonto === 0 ? "text-warning" : "text-text-primary"
                }`}
              >
                {resumen.conMonto === 0 ? SIN_DATO : fmtQ(resumen.total)}
              </strong>
              <p className="text-sm text-muted">
                {resumen.conMonto === 0 ? (
                  <>
                    Ninguno de los {nf.format(filteredDeals.length)} tratos de este filtro tiene el
                    campo <span className="text-text-primary">Monto de préstamo</span> registrado en
                    Pipedrive. No se estima a partir del valor del inmueble ni del enganche.
                  </>
                ) : (
                  <>
                    Suma de <span className="text-text-primary">Monto de préstamo</span> declarado en
                    Pipedrive, sobre {nf.format(resumen.conMonto)} de{" "}
                    {nf.format(filteredDeals.length)} tratos. Los {nf.format(resumen.sinMonto)}{" "}
                    restantes no tienen el campo registrado y no se estiman.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Tratos en el filtro" value={nf.format(filteredDeals.length)} />
              <KpiCard
                label="Con monto declarado"
                value={nf.format(resumen.conMonto)}
                hint={
                  filteredDeals.length > 0
                    ? `${Math.round((resumen.conMonto / filteredDeals.length) * 100)}% de cobertura`
                    : undefined
                }
              />
              <KpiCard label="Sin monto — Data no existe" value={nf.format(resumen.sinMonto)} negative />
              <KpiCard label="Aprobados por banco" value={nf.format(resumen.aprobadosBanco)} />
              <KpiCard label="Aprobados FHA" value={nf.format(resumen.aprobadosFHA)} />
              <KpiCard
                label="Con fecha de suspensión"
                value={nf.format(resumen.suspendidos)}
                hint="FHA o banco"
                negative
              />
            </div>

            {resumen.sinMonto > 0 ? (
              <div className="bg-warning/10 border border-warning/40 rounded-2xl p-4 flex gap-3">
                <span aria-hidden="true" className="text-base leading-none">
                  &#9888;
                </span>
                <p className="text-sm text-text-primary/80">
                  <strong className="text-text-primary">{SIN_DATO}</strong> en{" "}
                  {nf.format(resumen.sinMonto)} de {nf.format(filteredDeals.length)} tratos del filtro
                  actual: el campo <em>Monto de préstamo</em> está vacío en Pipedrive. Esos tratos
                  quedan fuera del total; nada se deriva a partir del valor del inmueble ni del
                  enganche. Para cerrarlos hay que capturar el monto en Pipedrive y regenerar el
                  snapshot.
                </p>
              </div>
            ) : null}

            {/* The headline breakdown: which bank owes us how much */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Panel
                id="monto-banco"
                title="Dinero a recibir por banco"
                subtitle={`Monto de préstamo sumado · ${alcanceProyecto}, ${alcance}`}
              >
                <HorizontalBarChart
                  data={montoPorBanco.bars}
                  format={fmtQ}
                  showShare
                  labelWidth={186}
                  emptyMessage={`${SIN_DATO} — ningún trato del filtro tiene banco y monto declarados`}
                />
                {montoSinBanco.tratos > 0 ? (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                    <span aria-hidden="true">&#9888;</span>{" "}
                    <strong className="text-text-primary">{fmtQ(montoSinBanco.total)}</strong> en{" "}
                    {nf.format(montoSinBanco.tratos)} tratos tienen monto pero{" "}
                    <em>Banco Seleccionado</em> vacío, así que no aparecen arriba. Por eso este
                    desglose suma menos que el total de la página.
                  </p>
                ) : null}
              </Panel>
              <Panel
                id="monto-proyecto"
                title="Dinero a recibir por proyecto"
                subtitle={`Monto de préstamo sumado · ${alcance}`}
              >
                <HorizontalBarChart
                  data={montoPorProyecto.bars}
                  format={fmtQ}
                  showShare
                  labelWidth={150}
                  emptyMessage={`${SIN_DATO} — ningún trato del filtro tiene monto declarado`}
                />
              </Panel>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Panel
                title="Tratos por etapa"
                subtitle={`Orden del embudo · ${alcanceProyecto}, ${alcance}`}
              >
                <HorizontalBarChart data={etapaCounts} labelWidth={212} showShare />
              </Panel>
              <Panel
                title="Banco seleccionado"
                subtitle={`Número de tratos y su porcentaje · ${alcanceProyecto}, ${alcance}`}
              >
                <HorizontalBarChart
                  data={bancoCounts}
                  labelWidth={186}
                  showShare
                  emptyMessage={`${SIN_DATO} — el campo Banco Seleccionado está vacío en todos los tratos del filtro`}
                />
              </Panel>
              <Panel
                title="Tipo de crédito"
                subtitle="Consolidado de los dos campos custom duplicados de Pipedrive"
              >
                <HorizontalBarChart data={tipoCounts} labelWidth={150} showShare />
              </Panel>
              <Panel
                title="Tratos por propietario"
                subtitle={`${alcanceProyecto}, ${alcance}`}
              >
                <HorizontalBarChart data={propietarioCounts} labelWidth={150} showShare />
              </Panel>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium text-text-primary">
                  Resumen por proyecto — {alcance}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Siempre los cinco proyectos, ignorando el filtro de proyecto, para que se vea dónde
                  falta el dato.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-4 py-2 font-medium">Proyecto</th>
                      <th className="px-4 py-2 font-medium text-right">Tratos</th>
                      <th className="px-4 py-2 font-medium text-right">Con monto</th>
                      <th className="px-4 py-2 font-medium text-right">Cobertura</th>
                      <th className="px-4 py-2 font-medium text-right">Bancos distintos</th>
                      <th className="px-4 py-2 font-medium text-right">Monto a recibir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {porProyecto.map((p) => (
                      <tr key={p.nombre} className="text-text-primary">
                        <td className="px-4 py-2 whitespace-nowrap font-medium">{p.nombre}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{nf.format(p.n)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{nf.format(p.con)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {p.n > 0 ? `${Math.round((p.con / p.n) * 100)}%` : "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{nf.format(p.bancos)}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                          {p.con > 0 ? (
                            fmtQ(p.total)
                          ) : (
                            <span className="text-warning font-medium">{SIN_DATO}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="etapas" className="bg-card rounded-2xl border border-border overflow-hidden scroll-mt-4">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium text-text-primary">
                  Etapas por embudo — abiertos, perdidos y mediana de días en etapa
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-4 py-2 font-medium">Proyecto</th>
                      <th className="px-4 py-2 font-medium">Embudo</th>
                      <th className="px-4 py-2 font-medium">Etapa</th>
                      <th className="px-4 py-2 font-medium text-right">Abiertos</th>
                      <th className="px-4 py-2 font-medium text-right">Perdidos</th>
                      <th className="px-4 py-2 font-medium text-right">Ganados</th>
                      <th className="px-4 py-2 font-medium text-right">Mediana días en etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {etapasPorEmbudo.map((r, i) => (
                      <tr key={i} className="text-text-primary">
                        <td className="px-4 py-2 whitespace-nowrap">{r.proyecto}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{r.embudo}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{r.etapa}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.open}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.lost}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {r.medianaDiasEnEtapa != null ? r.medianaDiasEnEtapa : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="sin-uso" className="bg-card rounded-2xl border border-border p-4 scroll-mt-4">
              <h2 className="text-sm font-medium text-text-primary">Etapas sin uso operativo</h2>
              <p className="text-sm text-muted mt-1">
                Estas etapas existen en la configuración de Pipedrive pero registran 0 tratos — el
                registro operativo se detiene en Resguardo / Resolución.
              </p>
              <ul className="mt-2 grid gap-1">
                {etapasSinUso.map((etapaNombre) => (
                  <li key={etapaNombre} className="text-sm text-text-primary flex items-baseline gap-2">
                    <span className="font-semibold tabular-nums text-muted">0</span> {etapaNombre}
                  </li>
                ))}
              </ul>
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

            <div id="tratos" className="bg-card rounded-2xl border border-border overflow-hidden scroll-mt-4">
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-baseline gap-3">
                <h2 className="text-sm font-medium text-text-primary">
                  Expedientes ({nf.format(filteredDeals.length)})
                </h2>
                <p className="text-xs text-muted">
                  Estado del crédito por cliente. Una celda con “—” es un campo que Pipedrive no
                  tiene registrado; {SIN_DATO} marca el monto que falta.
                  {resumen.vencidos > 0
                    ? ` ${nf.format(resumen.vencidos)} tratos abiertos pasaron su fecha de cierre prevista.`
                    : ""}
                </p>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-3 py-2 font-medium">Cliente</th>
                      <th className="px-3 py-2 font-medium">Proyecto</th>
                      <th className="px-3 py-2 font-medium">Etapa</th>
                      <th className="px-3 py-2 font-medium">Apto</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Banco</th>
                      <th className="px-3 py-2 font-medium text-right">Monto a recibir</th>
                      <th className="px-3 py-2 font-medium">Armado</th>
                      <th className="px-3 py-2 font-medium">Aprob. FHA</th>
                      <th className="px-3 py-2 font-medium">Aprob. banco</th>
                      <th className="px-3 py-2 font-medium">Suspendido</th>
                      <th className="px-3 py-2 font-medium">Cierre previsto</th>
                      <th className="px-3 py-2 font-medium text-right">Días en etapa</th>
                      <th className="px-3 py-2 font-medium">Propietario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredDeals.map((d) => {
                      const vencido =
                        d.estado === "open" && d.cierrePrevista != null && d.cierrePrevista < data.boundary;
                      return (
                        <tr key={d.dealId} className="text-text-primary">
                          <td className="px-3 py-2 whitespace-nowrap">{d.titulo}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{d.proyecto}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{d.etapa}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {d.apartamento ?? <span className="text-muted">—</span>}
                            {d.torre ? <span className="text-muted"> · {d.torre}</span> : null}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{d.tipoCredito}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {d.banco ?? <span className="text-muted">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums font-semibold">
                            {d.montoPrestamo != null ? (
                              fmtQ(d.montoPrestamo)
                            ) : (
                              <span className="text-warning font-medium">{SIN_DATO}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Fecha value={d.fechaArmado} />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Fecha value={d.fechaAprobacionFHA} />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Fecha value={d.fechaAprobacionBanco} />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Fecha value={d.suspendidoFHA ?? d.suspendidoBanco} />
                          </td>
                          <td
                            className={`px-3 py-2 whitespace-nowrap ${vencido ? "text-danger font-medium" : ""}`}
                          >
                            <Fecha value={d.cierrePrevista} />
                            {vencido ? " · vencido" : ""}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {d.diasEnEtapa != null ? d.diasEnEtapa : "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {d.propietario ?? <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-muted">
              Fuente: export de Pipedrive con corte {data.boundary}
              {data.fechaExport ? `, archivo del ${data.fechaExport}` : ""} ·{" "}
              {nf.format(data.totalTratos)} tratos en {data.proyectos.length} proyectos. Ningún monto
              se calcula ni se estima: todos vienen del campo Monto de préstamo tal como está en
              Pipedrive.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
