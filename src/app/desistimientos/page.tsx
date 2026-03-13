"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/error-banner";
import NavBar from "@/components/nav-bar";

type ProjectOption = { id: string; name: string };
type SaleRow = {
  id: string;
  project_name: string | null;
  unit_number: string | null;
  client_name: string | null;
  sale_date: string;
  status: string;
};

export default function DesistimientosPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/sales?distinct=project", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al cargar proyectos.");
      setProjects(payload.data ?? []);
    } catch {
      setProjects([]);
    }
  }

  async function fetchSales() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", "active");
      if (projectId) params.set("project_id", projectId);
      const res = await fetch(`/api/sales?${params.toString()}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al cargar ventas.");
      setSales(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [projectId]);

  async function handleDesistimiento(sale: SaleRow) {
    const confirmed = window.confirm(
      `¿Registrar desistimiento para ${sale.unit_number ?? "—"} (${sale.client_name ?? "—"})? La venta quedará cancelada y la unidad volverá a disponible.`
    );
    if (!confirmed) return;

    setActionId(sale.id);
    setError(null);
    try {
      const res = await fetch("/api/sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sale.id, status: "cancelled" })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al registrar desistimiento.");
      setSales((prev) => prev.filter((s) => s.id !== sale.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
      <NavBar />

      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-[11px] font-semibold text-muted mb-2">PAI · Operaciones</p>
          <h1 className="m-0 text-[clamp(20px,3vw,28px)]">Desistimientos</h1>
          <p className="text-muted m-0">
            Marca una venta activa como cancelada (desistimiento). La unidad volverá a disponible.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <a className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors no-underline" href="/">
            Volver al dashboard
          </a>
        </div>
      </header>

      <ErrorBanner error={error} />

      <section className="bg-card rounded-2xl p-4 shadow-card grid gap-4">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2>Ventas activas</h2>
            <p className="text-muted m-0">Solo ventas activas pueden registrarse como desistimiento.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              id="desist-project"
              className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ minWidth: "160px" }}
              aria-label="Filtrar por proyecto"
            >
              <option value="">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-2.5">
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "60%" }} />
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "80%" }} />
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "45%" }} />
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-2 shadow-card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Unidad</th>
                  <th>Cliente</th>
                  <th>Fecha venta</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sales.length ? (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.project_name ?? "—"}</td>
                      <td>{sale.unit_number ?? "—"}</td>
                      <td>{sale.client_name ?? "—"}</td>
                      <td>{sale.sale_date ? sale.sale_date.slice(0, 10) : "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors"
                          onClick={() => handleDesistimiento(sale)}
                          disabled={actionId !== null}
                          aria-busy={actionId === sale.id}
                        >
                          {actionId === sale.id ? "Guardando…" : "Registrar desistimiento"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="text-center text-muted py-6">
                        {projectId
                          ? "No hay ventas activas en este proyecto."
                          : "No hay ventas activas."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
