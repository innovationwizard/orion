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
    <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
      <nav className="flex flex-wrap gap-2 items-center text-[13px]">
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/">Dashboard</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/projects">Projects</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/desistimientos">Desistimientos</a>
        <span className="text-border select-none">|</span>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/disponibilidad">Disponibilidad</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/admin/reservas">Reservas</a>
      </nav>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-[11px] font-semibold text-muted mb-2">Orion · Administration</p>
          <h1 className="m-0 text-[clamp(20px,3vw,28px)]">Gestión de proyectos</h1>
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
            <h2>Nuevo proyecto</h2>
            <p className="text-muted m-0">Crea proyectos activos para ventas y pagos.</p>
          </div>
        </div>
        <form className="grid grid-cols-[1fr_auto] gap-3 items-center" onSubmit={handleCreate}>
          <input
            className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            placeholder="Nombre del proyecto"
            value={newProject.name}
            onChange={(event) => setNewProject({ name: event.target.value })}
          />
          <button className="border-none bg-primary text-white px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear proyecto"}
          </button>
        </form>
      </section>

      <section className="bg-card rounded-2xl p-4 shadow-card grid gap-4">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2>Proyectos registrados</h2>
            <p className="text-muted m-0">Administra los proyectos existentes.</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
              placeholder="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors" onClick={() => fetchProjects()}>
              Buscar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-2.5">
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "40%" }} />
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "75%" }} />
            <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] bg-[length:200%_200%] animate-pulse" style={{ width: "65%" }} />
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-2 shadow-card overflow-x-auto">
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
                            className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          project.name
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {editingId === project.id ? (
                            <>
                              <button
                                className="border-none bg-primary text-white px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover"
                                onClick={() => handleUpdate(project.id)}
                                disabled={isSaving}
                              >
                                Guardar
                              </button>
                              <button
                                className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors"
                                onClick={cancelEditing}
                                type="button"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors"
                                onClick={() => startEditing(project)}
                                type="button"
                              >
                                Editar
                              </button>
                              <button
                                className="bg-transparent border border-border text-text-primary hover:bg-primary/[0.08] hover:border-primary hover:text-primary px-3 py-1.5 text-[13px] rounded-full font-semibold cursor-pointer transition-colors"
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
                      <div className="text-center text-muted py-6">No hay proyectos registrados.</div>
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
