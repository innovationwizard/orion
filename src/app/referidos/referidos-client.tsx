"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useReferrals } from "@/hooks/use-referrals";
import NavBar from "@/components/nav-bar";
import ReferralTable from "./referral-table";
import ReferralForm from "./referral-form";

export default function ReferidosClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  const { data: projects } = useProjects();
  const { data: referrals, loading, refetch } = useReferrals({
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
    const ok = window.confirm("¿Eliminar este referido?");
    if (!ok) return;
    const res = await fetch(`/api/reservas/referidos/${id}`, { method: "DELETE" });
    if (res.ok) refetch();
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Referidos</h1>
          <p className="text-sm text-muted mt-1">
            Seguimiento de ventas por referido con precio especial
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
            + Nuevo referido
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary">
          Total: <strong className="tabular-nums">{referrals.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : referrals.length === 0 ? (
        <div className="py-12 text-center text-muted">
          No se encontraron referidos con los filtros seleccionados.
        </div>
      ) : (
        <ReferralTable referrals={referrals} onDelete={handleDelete} />
      )}

      {showForm && (
        <ReferralForm
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
