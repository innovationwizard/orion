"use client";

import { useEffect, useMemo, useState } from "react";
import ErrorBanner from "@/components/error-banner";
import type { Project } from "@/lib/types";

type ProjectPayload = {
  id?: string;
  name: string;
};

const emptyProject: ProjectPayload = {
  name: ""
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<ProjectPayload>(emptyProject);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) {
      return projects;
    }
    const term = search.trim().toLowerCase();
    return projects.filter((project) => project.name.toLowerCase().includes(term));
  }, [projects, search]);

  async function fetchProjects() {
    setIsLoading(true);
    setError(null);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const response = await fetch(`/api/projects${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar los proyectos.");
      }
      setProjects(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProject.name.trim()) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProject.name.trim() })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el proyecto.");
      }
      setProjects((prev) => [payload.data, ...prev]);
      setNewProject(emptyProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(project: Project) {
    setEditingId(project.id);
    setEditingName(project.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(projectId: string) {
    if (!editingName.trim()) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, name: editingName.trim() })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el proyecto.");
      }
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? payload.data : project))
      );
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`Eliminar el proyecto "${project.name}"?`);
    if (!confirmed) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el proyecto.");
      }
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsSaving(false);
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
        <a className="mini-nav__link" href="/desistimientos">
          Desistimientos
        </a>
      </nav>
      <header className="header">
        <div>
          <p className="eyebrow">Orion · Administration</p>
          <h1>Gestión de proyectos</h1>
        </div>
        <div className="header-actions">
          <a className="button secondary" href="/">
            Volver al dashboard
          </a>
        </div>
      </header>

      <ErrorBanner error={error} />

      <section className="card management-card">
        <div className="section-header">
          <div>
            <h2>Nuevo proyecto</h2>
            <p className="muted">Crea proyectos activos para ventas y pagos.</p>
          </div>
        </div>
        <form className="management-form" onSubmit={handleCreate}>
          <input
            className="input"
            placeholder="Nombre del proyecto"
            value={newProject.name}
            onChange={(event) => setNewProject({ name: event.target.value })}
          />
          <button className="button" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear proyecto"}
          </button>
        </form>
      </section>

      <section className="card management-card">
        <div className="section-header">
          <div>
            <h2>Proyectos registrados</h2>
            <p className="muted">Administra los proyectos existentes.</p>
          </div>
          <div className="management-search">
            <input
              className="input"
              placeholder="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="button secondary small" onClick={() => fetchProjects()}>
              Buscar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="skeleton">
            <div className="skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton-line" style={{ width: "75%" }} />
            <div className="skeleton-line" style={{ width: "65%" }} />
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        {editingId === project.id ? (
                          <input
                            className="input"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          project.name
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {editingId === project.id ? (
                            <>
                              <button
                                className="button small"
                                onClick={() => handleUpdate(project.id)}
                                disabled={isSaving}
                              >
                                Guardar
                              </button>
                              <button
                                className="button secondary small"
                                onClick={cancelEditing}
                                type="button"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="button secondary small"
                                onClick={() => startEditing(project)}
                                type="button"
                              >
                                Editar
                              </button>
                              <button
                                className="button secondary small"
                                onClick={() => handleDelete(project)}
                                type="button"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>
                      <div className="empty-state">No hay proyectos registrados.</div>
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
