"use client";

import { useCallback, useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";

interface LeadSource {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LeadSourcesClient() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(0);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lead-sources");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setSources(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearMsg = () => {
    setTimeout(() => setMsg(null), 3000);
  };

  // --- Add ---
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const maxOrder = sources.reduce((max, s) => Math.max(max, s.display_order), 0);
      const res = await fetch("/api/admin/lead-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), display_order: maxOrder + 1 }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setMsg({ type: "ok", text: `"${body.name}" agregada` });
        setNewName("");
        setShowAdd(false);
        fetchData();
        clearMsg();
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Toggle active ---
  const handleToggle = async (source: LeadSource) => {
    try {
      const res = await fetch(`/api/admin/lead-sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !source.is_active }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        fetchData();
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    }
  };

  // --- Save edit ---
  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/lead-sources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), display_order: editOrder }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setMsg({ type: "ok", text: "Actualizada" });
        setEditingId(null);
        fetchData();
        clearMsg();
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async (source: LeadSource) => {
    try {
      const res = await fetch(`/api/admin/lead-sources/${source.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: body.error ?? `Error ${res.status}` });
      } else {
        setMsg({ type: "ok", text: `"${source.name}" eliminada` });
        setDeletingId(null);
        fetchData();
        clearMsg();
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    }
  };

  const startEdit = (source: LeadSource) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditOrder(source.display_order);
    setShowAdd(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Stats
  const activeCount = sources.filter((s) => s.is_active).length;
  const inactiveCount = sources.length - activeCount;

  if (loading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1000px] mx-auto">
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
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1000px] mx-auto">
        <NavBar />
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center grid gap-4">
          <h2 className="text-lg font-bold text-text-primary">Error</h2>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1000px] mx-auto">
      <NavBar />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Fuentes de Clientes</h1>
          <p className="text-sm text-muted">
            Administra las opciones de fuente de captación para reservas
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
        >
          + Nueva fuente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={sources.length} />
        <StatCard label="Activas" value={activeCount} color="text-green-600" />
        <StatCard label="Inactivas" value={inactiveCount} color="text-gray-500" />
      </div>

      {/* Feedback */}
      {msg && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-4 grid gap-3">
          <h3 className="text-sm font-semibold text-text-primary">Agregar fuente</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre de la fuente"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setShowAdd(false);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <button
              type="button"
              disabled={saving || !newName.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40"
              onClick={handleAdd}
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-border text-muted text-sm hover:text-text-primary transition-colors"
              onClick={() => setShowAdd(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted w-16">Orden</th>
              <th className="px-4 py-3 font-medium text-muted">Nombre</th>
              <th className="px-4 py-3 font-medium text-muted w-24">Estado</th>
              <th className="px-4 py-3 font-medium text-muted w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Sin fuentes configuradas
                </td>
              </tr>
            ) : (
              sources.map((source) => {
                const isEditing = editingId === source.id;
                const isDeleting = deletingId === source.id;

                return (
                  <tr
                    key={source.id}
                    className={`border-b border-border last:border-b-0 transition-colors ${
                      !source.is_active ? "opacity-50" : ""
                    }`}
                  >
                    {/* Order */}
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editOrder}
                          onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 rounded border border-border bg-card text-text-primary text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        source.display_order
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-2 py-1 rounded border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          autoFocus
                        />
                      ) : (
                        source.name
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(source)}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0 transition-colors ${
                          source.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {source.is_active ? "Activa" : "Inactiva"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            type="button"
                            disabled={saving || !editName.trim()}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40"
                            onClick={handleSaveEdit}
                          >
                            {saving ? "..." : "Guardar"}
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs font-medium text-muted hover:text-text-primary transition-colors"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div className="flex gap-1 justify-end items-center">
                          <span className="text-xs text-muted mr-1">¿Eliminar?</span>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            onClick={() => handleDelete(source)}
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs font-medium text-muted hover:text-text-primary transition-colors"
                            onClick={() => setDeletingId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => startEdit(source)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() => setDeletingId(source.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
