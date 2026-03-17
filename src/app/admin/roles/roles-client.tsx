"use client";

import { useCallback, useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";

interface Project {
  id: string;
  name: string;
  slug: string;
  display_name: string;
}

interface Assignment {
  id: string;
  project_id: string;
  role: string;
  recipient_id: string;
  recipient_name: string;
  rate: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  gerencia_comercial: "Gerencia Comercial",
  supervisor_comercial: "Supervisor Comercial",
};

const ROLE_SHORT: Record<string, string> = {
  gerencia_comercial: "GC",
  supervisor_comercial: "SUPER",
};

function isActive(a: Assignment): boolean {
  if (!a.end_date) return true;
  return new Date(a.end_date) >= new Date(new Date().toISOString().slice(0, 10));
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtRate(rate: number): string {
  return (rate * 100).toFixed(2) + "%";
}

export default function RolesClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/management-roles");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setAssignments(json.assignments);
      setProjects(json.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  // Filter
  const filtered = assignments.filter((a) => {
    if (filterProject && a.project_id !== filterProject) return false;
    if (filterStatus === "active" && !isActive(a)) return false;
    if (filterStatus === "ended" && isActive(a)) return false;
    return true;
  });

  // Stats
  const activeCount = assignments.filter(isActive).length;
  const endedCount = assignments.length - activeCount;
  const projectsCovered = new Set(assignments.filter(isActive).map((a) => a.project_id)).size;

  const projectName = (projectId: string) => {
    const p = projects.find((p) => p.id === projectId);
    return p?.display_name ?? p?.name ?? "?";
  };

  if (loading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="grid gap-4">
          <div className="h-8 w-64 rounded-lg bg-border animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center grid gap-4">
          <h2 className="text-lg font-bold text-text-primary">Error</h2>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Roles de Gestión</h1>
          <p className="text-sm text-muted">
            Asignaciones de Gerencia Comercial y Supervisor por proyecto
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          onClick={() => {
            setShowAddForm(true);
            setSelectedId(null);
          }}
        >
          + Nueva asignación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={assignments.length} />
        <StatCard label="Vigentes" value={activeCount} color="text-green-600" />
        <StatCard label="Finalizadas" value={endedCount} color="text-gray-500" />
        <StatCard label="Proyectos cubiertos" value={projectsCovered} color="text-primary" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name ?? p.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["all", "active", "ended"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted border-border hover:text-text-primary"
              }`}
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "Todas" : s === "active" ? "Vigentes" : "Finalizadas"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted">Proyecto</th>
              <th className="px-4 py-3 font-medium text-muted">Rol</th>
              <th className="px-4 py-3 font-medium text-muted">Persona</th>
              <th className="px-4 py-3 font-medium text-muted text-right">Tasa</th>
              <th className="px-4 py-3 font-medium text-muted">Desde</th>
              <th className="px-4 py-3 font-medium text-muted">Hasta</th>
              <th className="px-4 py-3 font-medium text-muted">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Sin asignaciones
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const active = isActive(a);
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-primary/5 ${
                      selectedId === a.id ? "bg-primary/10" : ""
                    }`}
                    onClick={() => {
                      setSelectedId(a.id === selectedId ? null : a.id);
                      setShowAddForm(false);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {projectName(a.project_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {ROLE_SHORT[a.role] ?? a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{a.recipient_name}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {fmtRate(a.rate)}
                    </td>
                    <td className="px-4 py-3 text-muted">{fmtDate(a.start_date)}</td>
                    <td className="px-4 py-3 text-muted">
                      {a.end_date ? fmtDate(a.end_date) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {active ? "Vigente" : "Finalizada"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Side panel: detail */}
      {selected && !showAddForm && (
        <DetailPanel
          assignment={selected}
          projectName={projectName(selected.project_id)}
          onClose={() => setSelectedId(null)}
          onRefresh={fetchData}
        />
      )}

      {/* Side panel: add form */}
      {showAddForm && (
        <AddPanel
          projects={projects}
          onClose={() => setShowAddForm(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

/* ---------- StatCard ---------- */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className={`text-2xl font-bold ${color ?? "text-text-primary"}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

/* ---------- Detail Panel ---------- */

function DetailPanel({
  assignment: a,
  projectName,
  onClose,
  onRefresh,
}: {
  assignment: Assignment;
  projectName: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const active = isActive(a);
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleEnd = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/management-roles/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_date: endDate }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setMsg({ type: "ok", text: "Asignación finalizada" });
        onRefresh();
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-xl overflow-y-auto">
        <div className="p-6 grid gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{a.recipient_name}</h2>
              <p className="text-sm text-muted">
                {ROLE_LABELS[a.role] ?? a.role} — {projectName}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text-primary transition-colors"
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {active ? "Vigente" : "Finalizada"}
            </span>
            <span className="text-sm font-mono text-text-primary">{fmtRate(a.rate)}</span>
          </div>

          {/* Details */}
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Detalles</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Proyecto</span>
                <span className="text-text-primary">{projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Rol</span>
                <span className="text-text-primary">{ROLE_LABELS[a.role] ?? a.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ID destinatario</span>
                <span className="text-text-primary font-mono text-xs">{a.recipient_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tasa</span>
                <span className="text-text-primary font-mono">{fmtRate(a.rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Desde</span>
                <span className="text-text-primary">{fmtDate(a.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Hasta</span>
                <span className="text-text-primary">{a.end_date ? fmtDate(a.end_date) : "Sin fecha fin"}</span>
              </div>
              {a.notes && (
                <div className="pt-1">
                  <span className="text-muted text-xs">Notas:</span>
                  <p className="text-text-primary text-xs mt-0.5">{a.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* End assignment action */}
          {active && (
            <section className="grid gap-3">
              <h3 className="text-sm font-semibold text-text-primary">Finalizar asignación</h3>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  disabled={saving}
                  className="shrink-0 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
                  onClick={handleEnd}
                >
                  {saving ? "Guardando..." : "Finalizar"}
                </button>
              </div>
              {msg && (
                <p
                  className={`text-xs font-medium ${
                    msg.type === "ok" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {msg.text}
                </p>
              )}
            </section>
          )}

          {/* Meta */}
          <div className="text-xs text-muted grid gap-1 pt-2 border-t border-border">
            <div>ID: {a.id}</div>
            <div>Creado: {new Date(a.created_at).toLocaleDateString("es-GT")}</div>
            <div>Actualizado: {new Date(a.updated_at).toLocaleDateString("es-GT")}</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Add Panel ---------- */

function AddPanel({
  projects,
  onClose,
  onRefresh,
}: {
  projects: Project[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState("gerencia_comercial");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!projectId || !recipientId || !recipientName || !rate || !startDate) {
      setMsg({ type: "err", text: "Todos los campos son requeridos" });
      return;
    }
    const rateNum = parseFloat(rate) / 100;
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 5) {
      setMsg({ type: "err", text: "Tasa debe ser entre 0% y 5%" });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/management-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          role,
          recipient_id: recipientId,
          recipient_name: recipientName,
          rate: rateNum,
          start_date: startDate,
          end_date: null,
          notes: null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setMsg({ type: "ok", text: "Asignación creada" });
        onRefresh();
        // Reset form
        setRecipientId("");
        setRecipientName("");
        setRate("");
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-xl overflow-y-auto">
        <div className="p-6 grid gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Nueva asignación</h2>
              <p className="text-sm text-muted">
                Crear rol de gestión para un proyecto
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text-primary transition-colors"
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Proyecto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name ?? p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="gerencia_comercial">Gerencia Comercial</option>
                <option value="supervisor_comercial">Supervisor Comercial</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">ID destinatario</label>
              <input
                type="text"
                placeholder="e.g. antonio_rada"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Nombre</label>
              <input
                type="text"
                placeholder="e.g. Antonio Rada"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Tasa (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                placeholder="e.g. 0.30"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="button"
              disabled={saving || !projectId || !recipientId || !recipientName || !rate}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40"
              onClick={handleSubmit}
            >
              {saving ? "Creando..." : "Crear asignación"}
            </button>

            {msg && (
              <p
                className={`text-xs font-medium ${
                  msg.type === "ok" ? "text-green-600" : "text-red-500"
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
