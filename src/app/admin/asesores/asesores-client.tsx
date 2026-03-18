"use client";

import { useCallback, useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface SalespersonRow {
  id: string;
  full_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  auth_status: "active" | "pending" | "none";
  project_ids: string[];
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  none: "Sin cuenta",
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  none: "bg-gray-100 text-gray-500",
};

export default function AsesoresClient() {
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/salespeople");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setSalespeople(json.salespeople);
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

  const selected = salespeople.find((sp) => sp.id === selectedId) ?? null;

  const visibleSalespeople = showInactive
    ? salespeople
    : salespeople.filter((sp) => sp.is_active);
  const inactiveCount = salespeople.filter((sp) => !sp.is_active).length;

  // Stats (based on visible list)
  const total = visibleSalespeople.length;
  const withAccess = visibleSalespeople.filter((sp) => sp.auth_status === "active").length;
  const pending = visibleSalespeople.filter((sp) => sp.auth_status === "pending").length;
  const noAccount = visibleSalespeople.filter((sp) => sp.auth_status === "none").length;

  if (loading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="grid gap-4">
          <div className="h-8 w-64 rounded-lg bg-border animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Gestión de Asesores</h1>
          <p className="text-sm text-muted">
            Invitar asesores y asignar proyectos para acceso a /reservar
          </p>
        </div>
        {inactiveCount > 0 && (
          <button
            type="button"
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showInactive
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted border-border hover:text-text-primary"
            }`}
            onClick={() => setShowInactive((v) => !v)}
          >
            {showInactive ? `Ocultar inactivos (${inactiveCount})` : `Mostrar inactivos (${inactiveCount})`}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={total} />
        <StatCard label="Con acceso" value={withAccess} color="text-green-600" />
        <StatCard label="Pendientes" value={pending} color="text-amber-600" />
        <StatCard label="Sin cuenta" value={noAccount} color="text-gray-500" />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted">Nombre</th>
              <th className="px-4 py-3 font-medium text-muted">Email</th>
              <th className="px-4 py-3 font-medium text-muted">Estado</th>
              <th className="px-4 py-3 font-medium text-muted">Proyectos</th>
            </tr>
          </thead>
          <tbody>
            {visibleSalespeople.map((sp) => (
              <tr
                key={sp.id}
                className={`border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-primary/5 ${
                  selectedId === sp.id ? "bg-primary/10" : ""
                } ${!sp.is_active ? "opacity-50" : ""}`}
                onClick={() => setSelectedId(sp.id === selectedId ? null : sp.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    {sp.display_name}
                    {!sp.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-500 uppercase tracking-wide">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{sp.full_name}</div>
                </td>
                <td className="px-4 py-3 text-muted">{sp.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[sp.auth_status]}`}
                  >
                    {STATUS_LABEL[sp.auth_status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {sp.project_ids.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {sp.project_ids.map((pid) => {
                        const proj = projects.find((p) => p.id === pid);
                        return (
                          <span
                            key={pid}
                            className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium"
                          >
                            {proj?.slug?.split("-").map((w) => w[0]?.toUpperCase()).join("") ?? "?"}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Ninguno</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {selected && (
        <DetailPanel
          salesperson={selected}
          projects={projects}
          onClose={() => setSelectedId(null)}
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
  salesperson: sp,
  projects,
  onClose,
  onRefresh,
}: {
  salesperson: SalespersonRow;
  projects: Project[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState(sp.email ?? "");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedProjects, setSelectedProjects] = useState<string[]>(sp.project_ids);
  const [savingProjects, setSavingProjects] = useState(false);
  const [projectMsg, setProjectMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Reset everything when switching to a different salesperson
  useEffect(() => {
    setEmail(sp.email ?? "");
    setSelectedProjects(sp.project_ids);
    setInviteMsg(null);
    setInviteUrl(null);
    setCopied(false);
    setProjectMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.id]);

  // Sync form values when data refreshes (but preserve invite state)
  useEffect(() => {
    setSelectedProjects(sp.project_ids);
  }, [sp.project_ids]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    setInviteUrl(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/salespeople/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesperson_id: sp.id, email: email.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setInviteMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setInviteMsg({
          type: "ok",
          text: body.resent
            ? "Enlace de reingreso generado"
            : "Enlace de invitación generado",
        });
        if (body.invite_url) {
          setInviteUrl(body.invite_url);
        }
        onRefresh();
      }
    } catch (err) {
      setInviteMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setInviting(false);
    }
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
    setProjectMsg(null);
  };

  const projectsChanged =
    JSON.stringify([...selectedProjects].sort()) !==
    JSON.stringify([...sp.project_ids].sort());

  const handleSaveProjects = async () => {
    setSavingProjects(true);
    setProjectMsg(null);
    try {
      const res = await fetch("/api/admin/salespeople/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesperson_id: sp.id, project_ids: selectedProjects }),
      });
      const body = await res.json();
      if (!res.ok) {
        setProjectMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setProjectMsg({ type: "ok", text: "Proyectos actualizados" });
        onRefresh();
      }
    } catch (err) {
      setProjectMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSavingProjects(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-xl overflow-y-auto">
        <div className="p-6 grid gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{sp.display_name}</h2>
              <p className="text-sm text-muted">{sp.full_name}</p>
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
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[sp.auth_status]}`}
            >
              {STATUS_LABEL[sp.auth_status]}
            </span>
            {sp.phone && <span className="text-xs text-muted">{sp.phone}</span>}
          </div>

          {/* Invite section */}
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {sp.auth_status === "none" ? "Invitar asesor" : "Generar nuevo enlace"}
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                disabled={inviting || !email.trim()}
                className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40"
                onClick={handleInvite}
              >
                {inviting ? "Generando..." : sp.auth_status === "none" ? "Generar enlace" : "Nuevo enlace"}
              </button>
            </div>
            {inviteMsg && (
              <p
                className={`text-xs font-medium ${
                  inviteMsg.type === "ok" ? "text-green-600" : "text-red-500"
                }`}
              >
                {inviteMsg.text}
              </p>
            )}
            {inviteUrl && (
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-gray-50 text-text-primary text-xs font-mono truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-primary text-white hover:bg-primary-hover"
                    }`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                  >
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs text-muted">
                  Envía este enlace al asesor por WhatsApp para que active su cuenta.
                </p>
              </div>
            )}
          </div>

          {/* Project assignment */}
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Proyectos asignados</h3>
            <div className="grid gap-2">
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(p.id)}
                    onChange={() => handleToggleProject(p.id)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-text-primary">{p.name}</span>
                </label>
              ))}
            </div>
            {projectsChanged && (
              <button
                type="button"
                disabled={savingProjects}
                className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40"
                onClick={handleSaveProjects}
              >
                {savingProjects ? "Guardando..." : "Guardar proyectos"}
              </button>
            )}
            {projectMsg && (
              <p
                className={`text-xs font-medium ${
                  projectMsg.type === "ok" ? "text-green-600" : "text-red-500"
                }`}
              >
                {projectMsg.text}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="text-xs text-muted grid gap-1 pt-2 border-t border-border">
            <div>ID: {sp.id}</div>
            <div>Creado: {new Date(sp.created_at).toLocaleDateString("es-GT")}</div>
            {sp.user_id && <div>Auth ID: {sp.user_id}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
