"use client";

import { useEffect, useState } from "react";

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
    <section className="page management-page">
      <nav className="mini-nav">
        <a className="mini-nav__link" href="/">
          Dashboard
        </a>
        <a className="mini-nav__link" href="/projects">
          Projects
        </a>
        <a className="mini-nav__link" href="/desistimientos" aria-current="page">
          Desistimientos
        </a>
      </nav>

      <header className="header">
        <div>
          <p className="eyebrow">Orion · Operaciones</p>
          <h1>Desistimientos</h1>
          <p className="muted">
            Marca una venta activa como cancelada (desistimiento). La unidad volverá a disponible.
          </p>
        </div>
        <div className="header-actions">
          <a className="button secondary" href="/">
            Volver al dashboard
          </a>
        </div>
      </header>

      {error ? <div className="banner danger">{error}</div> : null}

      <section className="card management-card">
        <div className="section-header">
          <div>
            <h2>Ventas activas</h2>
            <p className="muted">Solo ventas activas pueden registrarse como desistimiento.</p>
          </div>
          <div className="header-actions">
            <select
              id="desist-project"
              className="input"
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
          <div className="skeleton">
            <div className="skeleton-line" style={{ width: "60%" }} />
            <div className="skeleton-line" style={{ width: "80%" }} />
            <div className="skeleton-line" style={{ width: "45%" }} />
          </div>
        ) : (
          <div className="table-card">
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
                          className="button secondary small"
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
                      <div className="empty-state">
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
