"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import type { CreditosPipelinePayload, PipelineDeal } from "@/app/api/creditos/pipeline/route";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

const nf = new Intl.NumberFormat("es-GT");

/**
 * Catálogo completo de etapas del Pipedrive (verificado contra la extracción 2026-08-05).
 * Los agregados del snapshot omiten etapas con cero tratos, así que las etapas sin uso
 * (Expediente Técnico, Aprobación E. Técnico / Avalúo, Escritura, Desembolso, Liquidación)
 * se rellenan con 0 aquí — existen en Pipedrive pero no se usan operativamente.
 */
const ETAPAS_CATALOGO = [
  "Promesa",
  "Armado de Expediente",
  "Análisis",
  "Suspendido",
  "Re-análisis",
  "Aprobación",
  "Expediente Técnico",
  "Ingreso E. Técnico / Avalúo",
  "Aprobación E. Técnico / Avalúo",
  "Resguardo / Resolución",
  "Escritura",
  "Desembolso",
  "Liquidación",
];

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

const ESTADO_LABELS: Record<string, string> = { open: "Abiertos", lost: "Perdidos", won: "Ganados" };

export default function PipelineClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CreditosPipelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const embudos = useMemo(
    () => (data ? [...new Set(data.deals.map((d) => d.embudo))].sort() : []),
    [data],
  );

  const filteredDeals = useMemo(() => {
    if (!data) return [] as PipelineDeal[];
    const q = search.trim().toLowerCase();
    return data.deals.filter(
      (d) =>
        (embudo === "todos" || d.embudo === embudo) &&
        (etapa === "todas" || d.etapa === etapa) &&
        (estado === "todos" || d.estado === estado) &&
        (q === "" ||
          d.titulo.toLowerCase().includes(q) ||
          (d.apartamento ?? "").toLowerCase().includes(q) ||
          (d.banco ?? "").toLowerCase().includes(q) ||
          (d.propietario ?? "").toLowerCase().includes(q)),
    );
  }, [data, embudo, etapa, estado, search]);

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="p-6 text-danger text-sm">No se pudo cargar el pipeline: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pipeline de Expedientes de Crédito</h1>
          <p className="text-sm text-muted mt-1">
            Pipedrive al {data?.boundary ?? "…"} — snapshot estático; se actualiza reemplazando el
            export y regenerando con scripts/extract-creditos-pipedrive.py
          </p>
        </div>

        {!data ? (
          <div className="grid gap-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-border/50" />
            <div className="h-64 rounded-2xl bg-border/50" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Tratos totales" value={nf.format(data.totalTratos)} />
              <KpiCard label="Abiertos" value={nf.format(data.estados.open ?? 0)} />
              <KpiCard label="Perdidos" value={nf.format(data.estados.lost ?? 0)} negative />
              <KpiCard
                label="Ganados"
                value={nf.format(data.estados.won ?? 0)}
                hint="≠ desembolso: se marca al armar expediente"
              />
              <KpiCard
                label="Suspendidos (abiertos)"
                value={nf.format(data.etapasGlobal.find((e) => e.etapa === "Suspendido")?.open ?? 0)}
              />
              <KpiCard
                label="Sin tipo de crédito"
                value={`${Math.round(((data.tipoCredito["Sin dato"] ?? 0) / data.totalTratos) * 100)}%`}
                hint="dos campos custom duplicados, consolidados"
              />
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <BarBlock
                title="Tratos abiertos por etapa"
                items={ETAPAS_CATALOGO.map((etapaNombre) => ({
                  label: etapaNombre,
                  count: data.etapasGlobal.find((e) => e.etapa === etapaNombre)?.open ?? 0,
                }))}
              />
              <BarBlock
                title="Tipo de crédito (todos los tratos)"
                items={Object.entries(data.tipoCredito).map(([label, count]) => ({ label, count }))}
              />
              <BarBlock
                title="Banco seleccionado (campo poblado)"
                items={Object.entries(data.bancos).map(([label, count]) => ({ label, count }))}
              />
              <BarBlock
                title="Tratos abiertos por propietario"
                items={Object.entries(data.propietariosAbiertos).map(([label, count]) => ({ label, count }))}
              />
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
                      <th className="px-4 py-2 font-medium">Embudo</th>
                      <th className="px-4 py-2 font-medium">Etapa</th>
                      <th className="px-4 py-2 font-medium text-right">Abiertos</th>
                      <th className="px-4 py-2 font-medium text-right">Perdidos</th>
                      <th className="px-4 py-2 font-medium text-right">Ganados</th>
                      <th className="px-4 py-2 font-medium text-right">Mediana días en etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.etapasPorEmbudo.map((r, i) => (
                      <tr key={i} className="text-text-primary">
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
                {ETAPAS_CATALOGO.filter(
                  (etapaNombre) =>
                    !data.etapasGlobal.some((e) => e.etapa === etapaNombre) &&
                    !data.etapasPorEmbudo.some((e) => e.etapa === etapaNombre),
                ).map((etapaNombre) => (
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
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-medium text-text-primary">
                  Tratos ({nf.format(filteredDeals.length)})
                </h2>
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
                <select
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value)}
                  className="text-sm border border-border rounded-lg px-2 py-1 bg-card"
                  aria-label="Filtrar por etapa"
                >
                  <option value="todas">Todas las etapas</option>
                  {ETAPAS_CATALOGO.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
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
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, apto, banco, propietario…"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card flex-1 min-w-[200px]"
                  aria-label="Buscar tratos"
                />
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-4 py-2 font-medium">Cliente</th>
                      <th className="px-4 py-2 font-medium">Embudo</th>
                      <th className="px-4 py-2 font-medium">Etapa</th>
                      <th className="px-4 py-2 font-medium">Apto</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Banco</th>
                      <th className="px-4 py-2 font-medium">Propietario</th>
                      <th className="px-4 py-2 font-medium text-right">Días en etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredDeals.map((d, i) => (
                      <tr key={i} className="text-text-primary">
                        <td className="px-4 py-2 whitespace-nowrap">{d.titulo}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.embudo}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.etapa}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.apartamento ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.tipoCredito}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.banco ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{d.propietario ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {d.diasEnEtapa != null ? d.diasEnEtapa : "—"}
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
