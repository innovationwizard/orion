"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useVentas } from "@/hooks/use-ventas";
import KpiCard from "@/components/kpi-card";
import NavBar from "@/components/nav-bar";
import MonthlyChart from "./monthly-chart";
import CumulativeChart from "./cumulative-chart";

export default function VentasClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  const { data: projects } = useProjects();
  const { data: { monthly, summary }, loading } = useVentas({ project: projectSlug || undefined });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Ritmo de Ventas</h1>
          <p className="text-sm text-muted mt-1">Velocidad de absorcion y tendencias mensuales</p>
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
      <section className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <KpiCard label="Total unidades" value={String(summary.total_units)} />
        <KpiCard
          label="Vendidas"
          value={String(summary.sold_units)}
          hint={`${Math.round(summary.absorption_rate * 100)}% absorcion`}
          positive
        />
        <KpiCard label="Disponibles" value={String(summary.available_units)} />
        <KpiCard
          label="Velocidad"
          value={`${summary.avg_monthly_velocity}/mes`}
          hint="Promedio mensual"
        />
        <KpiCard
          label="Meses restantes"
          value={summary.months_to_sellout > 0 ? String(summary.months_to_sellout) : "—"}
          hint="Al ritmo actual"
        />
      </section>

      {/* Charts */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <MonthlyChart data={monthly} />
          <CumulativeChart data={monthly} totalUnits={summary.total_units} />
        </>
      )}

      {/* Data table */}
      {monthly.length > 0 && (
        <section className="bg-card rounded-2xl shadow-card border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Mes</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Reservas</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Confirmadas</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Desistidas</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Neto</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="py-2 px-4 font-medium">{m.month}</td>
                  <td className="py-2 px-3 text-center">{m.reservations}</td>
                  <td className="py-2 px-3 text-center text-success">{m.confirmed}</td>
                  <td className="py-2 px-3 text-center text-danger">{m.desisted || "–"}</td>
                  <td className={`py-2 px-3 text-center font-semibold ${m.net >= 0 ? "text-success" : "text-danger"}`}>
                    {m.net >= 0 ? `+${m.net}` : m.net}
                  </td>
                  <td className="py-2 px-3 text-center">{m.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
