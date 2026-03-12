"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useBuyerPersona } from "@/hooks/use-buyer-persona";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import DistributionCard from "./distribution-card";

export default function BuyerPersonaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  const { data: projects } = useProjects();
  const { data, loading } = useBuyerPersona({
    project: projectSlug || undefined,
  });

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
          <h1 className="text-2xl font-bold text-text-primary">Buyer Persona</h1>
          <p className="text-sm text-muted mt-1">
            Demograficos y perfil del comprador
          </p>
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
        <KpiCard label="Perfiles registrados" value={String(data.total_profiles)} />
      </section>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : data.total_profiles === 0 ? (
        <div className="py-12 text-center text-muted">
          No hay perfiles registrados. Los perfiles se crean desde el detalle de reserva en Administracion.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DistributionCard title="Genero" items={data.by_gender} color="var(--color-primary)" />
          <DistributionCard title="Tipo de compra" items={data.by_purchase_type} color="var(--color-success)" />
          <DistributionCard title="Nivel educativo" items={data.by_education} color="#8b5cf6" />
          <DistributionCard title="Departamento" items={data.by_department} color="#f59e0b" />
          <DistributionCard title="Tipo de ocupacion" items={data.by_occupation} color="#06b6d4" />
          <DistributionCard title="Estado civil" items={data.by_marital_status} color="#ec4899" />
          <DistributionCard title="Canal de adquisicion" items={data.by_channel} color="#10b981" />
        </div>
      )}
    </div>
  );
}
