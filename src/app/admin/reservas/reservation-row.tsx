"use client";

import type { ReservationPending } from "@/lib/reservas/types";
import { RESERVATION_STATUS_LABELS, formatCurrency, formatDate } from "@/lib/reservas/constants";

type Props = {
  reservation: ReservationPending;
  selected: boolean;
  onClick: () => void;
};

const STATUS_BG: Record<string, string> = {
  PENDING_REVIEW: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  DESISTED: "bg-muted/15 text-muted",
};

export default function ReservationRow({ reservation: r, selected, onClick }: Props) {
  return (
    <tr
      className={`border-b border-border cursor-pointer transition-colors hover:bg-bg ${
        selected ? "bg-primary/5" : ""
      }`}
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap">
        {r.unit_number}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        {r.project_name}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        {r.client_names?.join(", ") ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        {r.salesperson_name}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary tabular-nums">
        {formatCurrency(r.deposit_amount)}
      </td>
      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
        {formatDate(r.submitted_at)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
            STATUS_BG[r.reservation_status] ?? "bg-border text-muted"
          }`}
        >
          {RESERVATION_STATUS_LABELS[r.reservation_status] ?? r.reservation_status}
        </span>
      </td>
    </tr>
  );
}
