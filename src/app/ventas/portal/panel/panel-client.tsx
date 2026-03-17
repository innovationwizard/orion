"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useVentasContext } from "@/lib/reservas/ventas-context";
import type { ReservationPending } from "@/lib/reservas/types";
import {
  RESERVATION_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/reservas/constants";
import KpiCard from "@/components/kpi-card";

const statusColor: Record<string, string> = {
  PENDING_REVIEW: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  DESISTED: "bg-muted/15 text-muted",
};

export default function PanelClient() {
  const { salesperson } = useVentasContext();
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
    fetchReservations();
  }, [fetchReservations]);

  const stats = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter(
      (r) => r.reservation_status === "CONFIRMED",
    ).length;
    const pending = reservations.filter(
      (r) => r.reservation_status === "PENDING_REVIEW",
    ).length;
    const desisted = reservations.filter(
      (r) => r.reservation_status === "DESISTED",
    ).length;
    const conversionRate =
      total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0.0";
    return { total, confirmed, pending, desisted, conversionRate };
  }, [reservations]);

  const recentReservations = useMemo(
    () =>
      [...reservations]
        .sort(
          (a, b) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime(),
        )
        .slice(0, 5),
    [reservations],
  );

  // Monthly trend for sparkline (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = reservations.filter((r) => {
        const rd = new Date(r.submitted_at);
        return (
          rd.getFullYear() === d.getFullYear() &&
          rd.getMonth() === d.getMonth()
        );
      }).length;
      months.push(count);
    }
    return months;
  }, [reservations]);

  return (
    <div className="grid gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Reservas"
          value={String(stats.total)}
          trend={monthlyTrend}
          trendColor="var(--color-primary)"
        />
        <KpiCard
          label="Confirmadas"
          value={String(stats.confirmed)}
          positive
          hint={`${stats.conversionRate}% conversión`}
        />
        <KpiCard
          label="Pendientes"
          value={String(stats.pending)}
        />
        <KpiCard
          label="Desistidas"
          value={String(stats.desisted)}
          negative={stats.desisted > 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <a
          href="/ventas/portal/nueva-reserva"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary/90 transition-colors"
        >
          + Nueva Reserva
        </a>
        <a
          href="/ventas/portal/inventario"
          className="px-4 py-2 rounded-lg border border-border text-text-primary text-sm font-medium no-underline hover:bg-bg transition-colors"
        >
          Ver Inventario
        </a>
      </div>

      {/* Recent Reservations */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            Reservas Recientes
          </h2>
        </div>

        {loading ? (
          <div className="p-4 animate-pulse grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-danger text-sm">{error}</div>
        ) : recentReservations.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted text-sm">
            No tienes reservas registradas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Cliente(s)
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map((r) => (
                <tr
                  key={r.reservation_id}
                  className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/ventas/portal/reservas?selected=${r.reservation_id}`)
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
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reservations.length > 5 && (
          <div className="px-4 py-3 border-t border-border text-center">
            <a
              href="/ventas/portal/reservas"
              className="text-sm text-primary font-medium no-underline hover:underline"
            >
              Ver todas ({reservations.length})
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
