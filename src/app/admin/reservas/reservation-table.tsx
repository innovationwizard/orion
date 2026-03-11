"use client";

import type { ReservationPending } from "@/lib/reservas/types";
import ReservationRow from "./reservation-row";

type Props = {
  data: ReservationPending[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ReservationTable({ data, selectedId, onSelect }: Props) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        No hay reservas con estos filtros.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Unidad
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Proyecto
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Cliente
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Asesor
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Monto
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Fecha
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <ReservationRow
              key={r.reservation_id}
              reservation={r}
              selected={r.reservation_id === selectedId}
              onClick={() => onSelect(r.reservation_id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
