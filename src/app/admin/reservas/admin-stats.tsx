"use client";

import type { ReservationPending } from "@/lib/reservas/types";

type Props = {
  data: ReservationPending[];
};

export default function AdminStats({ data }: Props) {
  const pending = data.filter((r) => r.reservation_status === "PENDING_REVIEW").length;
  const confirmed = data.filter((r) => r.reservation_status === "CONFIRMED").length;
  const rejected = data.filter((r) => r.reservation_status === "REJECTED").length;
  const desisted = data.filter((r) => r.reservation_status === "DESISTED").length;

  const cards = [
    { label: "Pendientes", value: pending, color: "text-warning" },
    { label: "Confirmadas", value: confirmed, color: "text-success" },
    { label: "Rechazadas", value: rejected, color: "text-danger" },
    { label: "Desistidas", value: desisted, color: "text-muted" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
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
  );
}
