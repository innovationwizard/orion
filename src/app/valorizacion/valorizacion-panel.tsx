"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { usePriceHistory } from "@/hooks/use-price-history";
import { formatCurrency } from "@/lib/reservas/constants";
import PriceHistoryTable from "./price-history-table";
import AppreciationChart from "./appreciation-chart";
import EntryForm from "./entry-form";
import DesistimientosSections from "./desistimientos-sections";

type ValorizacionPanelProps = {
  /** Project slug filter. The standalone page drives this from `?project=`; the
   *  embedded copy receives the host page's current selection. */
  projectSlug?: string;
  /** Project picker, rendered by the standalone page in its header. */
  onProjectChange?: (slug: string) => void;
};

export default function ValorizacionPanel({ projectSlug = "", onProjectChange }: ValorizacionPanelProps) {
  const { data: projects } = useProjects();
  const { data: entries, loading, refetch } = usePriceHistory({
    project: projectSlug || undefined,
  });

  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Eliminar este registro de valorizacion?");
    if (!ok) return;
    const res = await fetch(`/api/reservas/valorizacion/${id}`, { method: "DELETE" });
    if (res.ok) refetch();
  }

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const currency = projects.find((p) => p.project_slug === projectSlug)?.currency;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary">
            Registros: <strong className="tabular-nums">{entries.length}</strong>
          </span>
          {latest?.appreciation_total != null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-success">
              Apreciacion total:{" "}
              <strong className="tabular-nums">{formatCurrency(latest.appreciation_total, currency)}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {onProjectChange && (
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={projectSlug}
              onChange={(e) => onProjectChange(e.target.value)}
            >
              <option value="">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.project_slug} value={p.project_slug}>
                  {p.project_name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            onClick={() => setShowForm(true)}
          >
            + Nuevo registro
          </button>
        </div>
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
          <AppreciationChart data={entries} currency={currency} />
          {entries.length === 0 ? (
            <div className="py-12 text-center text-muted">
              No hay registros de valorizacion con los filtros seleccionados.
            </div>
          ) : (
            <PriceHistoryTable entries={entries} onDelete={handleDelete} currency={currency} />
          )}
        </>
      )}

      {/* Desistimientos y trazabilidad — todos los proyectos */}
      <DesistimientosSections />

      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
