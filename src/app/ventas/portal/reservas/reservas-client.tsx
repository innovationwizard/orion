"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useVentasContext } from "@/lib/reservas/ventas-context";
import type { ReservationPending } from "@/lib/reservas/types";
import {
  RESERVATION_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/reservas/constants";
import VentasReservationDetail from "./ventas-reservation-detail";

function getInitialParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

const statusColor: Record<string, string> = {
  PENDING_REVIEW: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  DESISTED: "bg-muted/15 text-muted",
};

type StatusFilter = "" | "PENDING_REVIEW" | "CONFIRMED" | "REJECTED" | "DESISTED";

export default function ReservasClient() {
  const { projects } = useVentasContext();
  const [reservations, setReservations] = useState<ReservationPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => getInitialParam("selected") || null,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [projectFilter, setProjectFilter] = useState("");

  const fetchReservations = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (projectFilter) params.set("project", projectFilter);
    const qs = params.toString();
    fetch(`/api/reservas/ventas/reservations${qs ? `?${qs}` : ""}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setReservations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, projectFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Counts
  const counts = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter(
      (r) => r.reservation_status === "PENDING_REVIEW",
    ).length;
    const confirmed = reservations.filter(
      (r) => r.reservation_status === "CONFIRMED",
    ).length;
    const desisted = reservations.filter(
      (r) => r.reservation_status === "DESISTED",
    ).length;
    const rejected = reservations.filter(
      (r) => r.reservation_status === "REJECTED",
    ).length;
    return { total, pending, confirmed, desisted, rejected };
  }, [reservations]);

  // Sort by date descending
  const sorted = useMemo(
    () =>
      [...reservations].sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime(),
      ),
    [reservations],
  );

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="">Todos ({counts.total})</option>
            <option value="PENDING_REVIEW">
              Pendientes ({counts.pending})
            </option>
            <option value="CONFIRMED">Confirmadas ({counts.confirmed})</option>
            <option value="DESISTED">Desistidas ({counts.desisted})</option>
            <option value="REJECTED">Rechazadas ({counts.rejected})</option>
          </select>

          {/* Project filter */}
          {projects.length > 1 && (
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <a
          href="/ventas/portal/nueva-reserva"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary/90 transition-colors"
        >
          + Nueva Reserva
        </a>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted">No se encontraron reservas.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Cliente(s)
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Documentos
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const canGeneratePdf =
                  r.project_slug === "boulevard-5" &&
                  r.reservation_status === "CONFIRMED";
                const isSelected = selectedId === r.reservation_id;
                return (
                  <tr
                    key={r.reservation_id}
                    className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/5"
                        : "hover:bg-bg/50"
                    }`}
                    onClick={() =>
                      setSelectedId(
                        isSelected ? null : r.reservation_id,
                      )
                    }
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {r.unit_number}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {r.project_name}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {r.client_names?.join(", ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-primary tabular-nums">
                      {r.deposit_amount != null
                        ? formatCurrency(r.deposit_amount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDate(r.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.reservation_status] ?? ""}`}
                      >
                        {RESERVATION_STATUS_LABELS[r.reservation_status] ??
                          r.reservation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {canGeneratePdf ? (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() =>
                              window.open(
                                `/ventas/dashboard/pcv/${r.reservation_id}`,
                                "_blank",
                              )
                            }
                          >
                            PCV
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() =>
                              window.open(
                                `/ventas/dashboard/carta-autorizacion/${r.reservation_id}`,
                                "_blank",
                              )
                            }
                          >
                            Autorización
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                            onClick={() =>
                              window.open(
                                `/ventas/dashboard/carta-pago/${r.reservation_id}`,
                                "_blank",
                              )
                            }
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

      {/* Detail side panel */}
      {selectedId && (
        <VentasReservationDetail
          reservationId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
