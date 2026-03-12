"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export default function EntryForm({ onClose, onSaved }: Props) {
  const { data: projects } = useProjects();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [unitsRemaining, setUnitsRemaining] = useState("");
  const [incrementAmount, setIncrementAmount] = useState("");
  const [incrementPct, setIncrementPct] = useState("");
  const [newPriceAvg, setNewPriceAvg] = useState("");
  const [appreciationTotal, setAppreciationTotal] = useState("");
  const [notes, setNotes] = useState("");

  // Get towers for selected project
  const selectedProject = projects.find((p) => p.project_id === projectId);
  const towers = selectedProject?.towers ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/reservas/valorizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          tower_id: towerId || null,
          effective_date: effectiveDate,
          units_remaining: Number(unitsRemaining),
          increment_amount: Number(incrementAmount),
          increment_pct: incrementPct ? Number(incrementPct) : null,
          new_price_avg: newPriceAvg ? Number(newPriceAvg) : null,
          appreciation_total: appreciationTotal ? Number(appreciationTotal) : null,
          notes: notes.trim() || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al guardar");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-lg grid gap-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-text-primary">Nuevo registro de valorizacion</h2>

        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Proyecto *</span>
            <select
              required
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTowerId("");
              }}
            >
              <option value="">Seleccionar...</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Torre</span>
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={towerId}
              onChange={(e) => setTowerId(e.target.value)}
              disabled={!projectId}
            >
              <option value="">Todas / General</option>
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Fecha efectiva *</span>
            <input
              required
              type="date"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Unidades restantes *</span>
            <input
              required
              type="number"
              min="0"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={unitsRemaining}
              onChange={(e) => setUnitsRemaining(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Monto incremento *</span>
            <input
              required
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(e.target.value)}
              placeholder="Q0.00"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">% Incremento</span>
            <input
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={incrementPct}
              onChange={(e) => setIncrementPct(e.target.value)}
              placeholder="e.g. 2.5"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Precio promedio nuevo</span>
            <input
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={newPriceAvg}
              onChange={(e) => setNewPriceAvg(e.target.value)}
              placeholder="Q0.00"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Apreciacion total</span>
            <input
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={appreciationTotal}
              onChange={(e) => setAppreciationTotal(e.target.value)}
              placeholder="Q0.00"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Notas</span>
          <textarea
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm resize-y"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones opcionales..."
          />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-border text-text-primary text-sm font-semibold hover:bg-bg/50 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
