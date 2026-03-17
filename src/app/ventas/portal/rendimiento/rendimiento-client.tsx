"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ReservationPending } from "@/lib/reservas/types";
import KpiCard from "@/components/kpi-card";
import VelocityChart from "./velocity-chart";

interface MonthBucket {
  label: string;
  submitted: number;
  confirmed: number;
  desisted: number;
  rejected: number;
}

export default function RendimientoClient() {
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

  // KPIs
  const kpis = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter(
      (r) => r.reservation_status === "CONFIRMED",
    ).length;
    const desisted = reservations.filter(
      (r) => r.reservation_status === "DESISTED",
    ).length;
    const pending = reservations.filter(
      (r) => r.reservation_status === "PENDING_REVIEW",
    ).length;

    const conversionRate =
      total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0.0";
    const desistimientoRate =
      total > 0 ? ((desisted / total) * 100).toFixed(1) : "0.0";

    return { total, confirmed, desisted, pending, conversionRate, desistimientoRate };
  }, [reservations]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: number[] = [];
    const now = new Date();
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

  // Monthly breakdown (last 12 months)
  const monthlyBuckets = useMemo(() => {
    const buckets: MonthBucket[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("es-GT", {
        month: "short",
        year: "numeric",
      });
      const monthReservations = reservations.filter((r) => {
        const rd = new Date(r.submitted_at);
        return (
          rd.getFullYear() === d.getFullYear() &&
          rd.getMonth() === d.getMonth()
        );
      });
      buckets.push({
        label: monthLabel,
        submitted: monthReservations.length,
        confirmed: monthReservations.filter(
          (r) => r.reservation_status === "CONFIRMED",
        ).length,
        desisted: monthReservations.filter(
          (r) => r.reservation_status === "DESISTED",
        ).length,
        rejected: monthReservations.filter(
          (r) => r.reservation_status === "REJECTED",
        ).length,
      });
    }
    return buckets;
  }, [reservations]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-4 shadow-card h-24 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Reservas"
          value={String(kpis.total)}
          trend={monthlyTrend}
          trendColor="var(--color-primary)"
        />
        <KpiCard
          label="Tasa de Conversión"
          value={`${kpis.conversionRate}%`}
          hint={`${kpis.confirmed} confirmadas`}
          positive={parseFloat(kpis.conversionRate) >= 70}
        />
        <KpiCard
          label="Tasa de Desistimiento"
          value={`${kpis.desistimientoRate}%`}
          hint={`${kpis.desisted} desistidas`}
          negative={kpis.desisted > 0}
        />
        <KpiCard
          label="Pendientes"
          value={String(kpis.pending)}
          hint={kpis.pending > 0 ? "en revisión" : ""}
        />
      </div>

      {/* Monthly velocity chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Reservas por mes
        </h3>
        <VelocityChart buckets={monthlyBuckets} />
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                Mes
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                Enviadas
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                Confirmadas
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                Desistidas
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                Rechazadas
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                Neto
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyBuckets.map((m) => (
              <tr
                key={m.label}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-text-primary capitalize">
                  {m.label}
                </td>
                <td className="px-4 py-3 text-text-primary text-right tabular-nums">
                  {m.submitted}
                </td>
                <td className="px-4 py-3 text-success text-right tabular-nums">
                  {m.confirmed}
                </td>
                <td className="px-4 py-3 text-muted text-right tabular-nums">
                  {m.desisted}
                </td>
                <td className="px-4 py-3 text-danger text-right tabular-nums">
                  {m.rejected}
                </td>
                <td className="px-4 py-3 text-text-primary font-medium text-right tabular-nums">
                  {m.confirmed - m.desisted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
