"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { usePriceHistory } from "@/hooks/use-price-history";
import NavBar from "@/components/nav-bar";
import PriceHistoryTable from "./price-history-table";
import AppreciationChart from "./appreciation-chart";
import EntryForm from "./entry-form";

export default function ValorizacionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  const { data: projects } = useProjects();
  const { data: entries, loading, refetch } = usePriceHistory({
    project: projectSlug || undefined,
  });

  const [showForm, setShowForm] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Eliminar este registro de valorizacion?");
    if (!ok) return;
    const res = await fetch(`/api/reservas/valorizacion/${id}`, { method: "DELETE" });
    if (res.ok) refetch();
  }

  // Latest entry stats
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Valorizacion</h1>
          <p className="text-sm text-muted mt-1">
            Historial de incrementos de precio y apreciacion acumulada
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
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
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            onClick={() => setShowForm(true)}
          >
            + Nuevo registro
          </button>
        </div>
      </header>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary">
          Registros: <strong className="tabular-nums">{entries.length}</strong>
        </span>
        {latest?.appreciation_total != null && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-success">
            Apreciacion total: <strong className="tabular-nums">Q{latest.appreciation_total.toLocaleString("es-GT")}</strong>
          </span>
        )}
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <AppreciationChart data={entries} />
          {entries.length === 0 ? (
            <div className="py-12 text-center text-muted">
              No hay registros de valorizacion con los filtros seleccionados.
            </div>
          ) : (
            <PriceHistoryTable entries={entries} onDelete={handleDelete} />
          )}
        </>
      )}

      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
