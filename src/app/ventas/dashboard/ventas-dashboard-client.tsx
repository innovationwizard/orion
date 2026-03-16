"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCurrentSalesperson } from "@/hooks/use-current-salesperson";
import type { ReservationPending } from "@/lib/reservas/types";
import {
  RESERVATION_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/reservas/constants";
import NavBar from "@/components/nav-bar";

export default function VentasDashboardClient() {
  const { data: spData, loading: spLoading, error: spError } = useCurrentSalesperson();
  const [reservations, setReservations] = useState<ReservationPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/reservas/ventas/reservations")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setReservations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (spData) fetchReservations();
  }, [spData, fetchReservations]);

  // KPI stats
  const stats = useMemo(() => {
    const pending = reservations.filter((r) => r.reservation_status === "PENDING_REVIEW").length;
    const confirmed = reservations.filter((r) => r.reservation_status === "CONFIRMED").length;
    const desisted = reservations.filter((r) => r.reservation_status === "DESISTED").length;
    const rejected = reservations.filter((r) => r.reservation_status === "REJECTED").length;
    return [
      { label: "Total", value: reservations.length, color: "text-text-primary" },
      { label: "Confirmadas", value: confirmed, color: "text-success" },
      { label: "Pendientes", value: pending, color: "text-warning" },
      { label: "Desistidas", value: desisted, color: "text-muted" },
      { label: "Rechazadas", value: rejected, color: "text-danger" },
    ];
  }, [reservations]);

  if (spLoading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="animate-pulse grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-border" />
          ))}
        </div>
      </div>
    );
  }

  if (spError || !spData) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted">
            Esta página es solo para asesores de ventas.
          </p>
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    PENDING_REVIEW: "bg-warning/15 text-warning",
    CONFIRMED: "bg-success/15 text-success",
    REJECTED: "bg-danger/15 text-danger",
    DESISTED: "bg-muted/15 text-muted",
  };

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mis Reservas</h1>
        <p className="text-sm text-muted mt-1">{spData.salesperson.display_name}</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((c) => (
          <div
            key={c.label}
            className="bg-card rounded-xl border border-border p-4 grid gap-1"
          >
            <span className="text-xs text-muted">{c.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${c.color}`}>
              {c.value}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
      ) : reservations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted">No tienes reservas registradas.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Unidad</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Cliente(s)</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Documentos</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const canGeneratePdf = r.project_slug === "boulevard-5" && r.reservation_status === "CONFIRMED";
                return (
                  <tr key={r.reservation_id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{r.unit_number}</td>
                    <td className="px-4 py-3 text-text-primary">{r.project_name}</td>
                    <td className="px-4 py-3 text-text-primary">
                      {r.client_names?.join(", ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-primary tabular-nums">
                      {r.deposit_amount != null ? formatCurrency(r.deposit_amount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDate(r.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.reservation_status] ?? ""}`}>
                        {RESERVATION_STATUS_LABELS[r.reservation_status] ?? r.reservation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canGeneratePdf ? (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() => window.open(`/ventas/dashboard/pcv/${r.reservation_id}`, "_blank")}
                          >
                            PCV
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() => window.open(`/ventas/dashboard/carta-autorizacion/${r.reservation_id}`, "_blank")}
                          >
                            Autorización
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() => window.open(`/ventas/dashboard/carta-pago/${r.reservation_id}`, "_blank")}
                          >
                            Pago
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
