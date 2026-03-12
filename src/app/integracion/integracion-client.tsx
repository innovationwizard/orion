"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useIntegration } from "@/hooks/use-integration";
import KpiCard from "@/components/kpi-card";
import NavBar from "@/components/nav-bar";
import PipelineTable from "./pipeline-table";

export default function IntegracionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  const { data: projects } = useProjects();
  const { data, loading } = useIntegration({ project: projectSlug || undefined });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Aggregate totals
  const totals = useMemo(() => {
    const t = { available: 0, soft_hold: 0, reserved: 0, frozen: 0, sold: 0, total: 0, desisted_total: 0 };
    for (const r of data) {
      t.available += r.available;
      t.soft_hold += r.soft_hold;
      t.reserved += r.reserved;
      t.frozen += r.frozen;
      t.sold += r.sold;
      t.total += r.total;
      t.desisted_total += r.desisted_total;
    }
    return t;
  }, [data]);

  const pctVendido = totals.total > 0 ? Math.round(((totals.sold + totals.reserved) / totals.total) * 100) : 0;

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Integracion</h1>
          <p className="text-sm text-muted mt-1">Resumen de pipeline por torre</p>
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={projectSlug}
          onChange={(e) => updateParam("project", e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.project_slug} value={p.project_slug}>
              {p.project_name}
            </option>
          ))}
        </select>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        <KpiCard label="Total unidades" value={String(totals.total)} />
        <KpiCard label="Vendidas" value={String(totals.sold)} positive />
        <KpiCard label="Reservadas" value={String(totals.reserved)} />
        <KpiCard label="Disponibles" value={String(totals.available)} />
        <KpiCard label="Congeladas" value={String(totals.frozen)} />
        <KpiCard label="% Vendido" value={`${pctVendido}%`} hint="Vendido + Reservado" />
      </section>

      {/* Pipeline table */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : (
        <PipelineTable rows={data} />
      )}
    </div>
  );
}
