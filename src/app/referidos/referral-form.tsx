"use client";

import { useState, useEffect } from "react";
import type { UnitFull, Salesperson } from "@/lib/reservas/types";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export default function ReferralForm({ onClose, onSaved }: Props) {
  const [units, setUnits] = useState<UnitFull[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [unitId, setUnitId] = useState("");
  const [clientName, setClientName] = useState("");
  const [referidoPor, setReferidoPor] = useState("");
  const [precioLista, setPrecioLista] = useState("");
  const [precioReferido, setPrecioReferido] = useState("");
  const [fechaReserva, setFechaReserva] = useState("");
  const [salespersonId, setSalespersonId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/reservas/units")
      .then((r) => r.json())
      .then(setUnits)
      .catch(() => {});
    fetch("/api/reservas/salespeople")
      .then((r) => r.json())
      .then(setSalespeople)
      .catch(() => {});
  }, []);

  // Auto-fill precio_lista when unit is selected
  useEffect(() => {
    if (!unitId) return;
    const unit = units.find((u) => u.id === unitId);
    if (unit?.price_list) {
      setPrecioLista(String(unit.price_list));
    }
  }, [unitId, units]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/reservas/referidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: unitId,
          client_name: clientName.trim(),
          referido_por: referidoPor.trim(),
          precio_lista: precioLista ? Number(precioLista) : null,
          precio_referido: precioReferido ? Number(precioReferido) : null,
          fecha_reserva: fechaReserva || null,
          salesperson_id: salespersonId || null,
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
        <h2 className="text-lg font-bold text-text-primary">Nuevo referido</h2>

        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Unidad *</span>
          <select
            required
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <option value="">Seleccionar unidad...</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.project_name} — {u.tower_name} — {u.unit_number} ({u.unit_type})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Cliente *</span>
          <input
            required
            type="text"
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre del cliente"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Referido por *</span>
          <input
            required
            type="text"
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
            value={referidoPor}
            onChange={(e) => setReferidoPor(e.target.value)}
            placeholder="Nombre de quien refiere"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Precio lista</span>
            <input
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={precioLista}
              onChange={(e) => setPrecioLista(e.target.value)}
              placeholder="Q0.00"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Precio referido</span>
            <input
              type="number"
              step="0.01"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={precioReferido}
              onChange={(e) => setPrecioReferido(e.target.value)}
              placeholder="Q0.00"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Fecha reserva</span>
            <input
              type="date"
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={fechaReserva}
              onChange={(e) => setFechaReserva(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Asesor</span>
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm"
              value={salespersonId}
              onChange={(e) => setSalespersonId(e.target.value)}
            >
              <option value="">Sin asesor</option>
              {salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
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
