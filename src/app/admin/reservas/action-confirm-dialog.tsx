"use client";

import { useState } from "react";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  requireReason?: boolean;
  requireDate?: boolean;
  onConfirm: (reason: string, date: string) => Promise<void>;
  onCancel: () => void;
};

export default function ActionConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  requireReason,
  requireDate,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    (!requireReason || reason.trim().length > 0) &&
    (!requireDate || date.length > 0);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason.trim(), date);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  }

  const btnClass =
    confirmVariant === "danger"
      ? "bg-danger text-white hover:bg-danger/90"
      : "bg-primary text-white hover:bg-primary-hover";

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-transparent"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-card rounded-2xl shadow-card border border-border p-6 w-full max-w-md mx-4 grid gap-4">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-muted">{description}</p>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
        )}

        {requireReason && (
          <div className="grid gap-1">
            <label className="text-sm font-medium text-text-primary">Motivo</label>
            <textarea
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-y"
              placeholder="Escriba el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {requireDate && (
          <div className="grid gap-1">
            <label className="text-sm font-medium text-text-primary">Fecha</label>
            <input
              type="date"
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border text-muted font-medium text-sm hover:bg-bg transition-colors disabled:opacity-40"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || !canSubmit}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 ${btnClass}`}
            onClick={handleConfirm}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
