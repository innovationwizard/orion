"use client";

import { useEffect, useRef } from "react";
import type { PaymentAnalyticsUnit } from "@/components/payment-treemap";

type PaymentDetailModalProps = {
  open: boolean;
  unit: PaymentAnalyticsUnit | null;
  onClose: () => void;
};

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

function formatPaymentType(type: string) {
  if (type === "reservation") return "Reserva";
  if (type === "down_payment") return "Enganche";
  if (type === "financed_payment") return "Cuota";
  return type;
}

export default function PaymentDetailModal({ open, unit, onClose }: PaymentDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!unit) {
    return null;
  }

  const isCompliance = unit.expectedToDate != null;
  const rows: Array<{ label: string; expected: number; paid: number }> = isCompliance
    ? [
        {
          label: "Esperado a la fecha",
          expected: unit.expectedToDate ?? unit.totalExpected,
          paid: unit.totalPaid
        }
      ]
    : [
        {
          label: "Enganche total",
          expected: unit.engancheTotal?.expected ?? 0,
          paid: unit.engancheTotal?.paid ?? 0
        },
        {
          label: "Reserva",
          expected: unit.reserve?.expected ?? 0,
          paid: unit.reserve?.paid ?? 0
        },
        {
          label: "Enganche fraccionado",
          expected: unit.downPayment?.expected ?? 0,
          paid: unit.downPayment?.paid ?? 0
        },
        (unit.installments?.expected ?? 0) > 0 || (unit.installments?.paid ?? 0) > 0
          ? {
              label: "Cuotas",
              expected: unit.installments?.expected ?? 0,
              paid: unit.installments?.paid ?? 0
            }
          : null,
        {
          label: "Total",
          expected: unit.totalExpected,
          paid: unit.totalPaid
        }
      ].filter(Boolean) as Array<{ label: string; expected: number; paid: number }>;

  const statusLabel =
    unit.complianceStatus === "ahead"
      ? "Adelantado"
      : unit.complianceStatus === "on_track"
        ? "Al día"
        : unit.complianceStatus === "behind"
          ? "En mora"
          : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="border-none rounded-2xl p-0 max-w-[min(640px,95vw)] w-full shadow-card backdrop:bg-black/40"
    >
      <div className="p-6 grid gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h3>Detalle de pagos</h3>
            <p className="text-muted m-0">
              Unidad {unit.unitNumber} · {unit.clientName}
            </p>
          </div>
          <button className="border-none bg-transparent text-xl cursor-pointer text-muted" onClick={onClose}>
            ×
          </button>
        </div>

        {isCompliance && statusLabel != null && (
          <p className="text-sm text-muted m-0">
            Estado: <strong>{statusLabel}</strong>
            {unit.daysDelinquent != null && unit.daysDelinquent > 0 && (
              <> · {unit.daysDelinquent} días en mora</>
            )}
          </p>
        )}
        {!isCompliance && (
          <p className="text-sm text-muted m-0">
            Enganche total = Reserva + Enganche fraccionado (este último se paga en mensualidades).
          </p>
        )}
        <div className="grid text-sm">
          <div className="grid grid-cols-4 gap-2 font-semibold text-muted py-2 border-b border-border">
            <span>Concepto</span>
            <span>Esperado</span>
            <span>Cobrado</span>
            <span>Diferencia</span>
          </div>
          {rows.map((row) => {
            const diff = row.paid - row.expected;
            return (
              <div className="grid grid-cols-4 gap-2 py-2 border-b border-border/50" key={row.label}>
                <span>{row.label}</span>
                <span>{currency.format(row.expected)}</span>
                <span>{currency.format(row.paid)}</span>
                <span className={diff >= 0 ? "text-success" : "text-danger"}>
                  {currency.format(diff)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2">
          <h4>Historial de pagos</h4>
          {unit.paymentHistory.length ? (
            <ul className="list-none p-0 m-0 grid gap-1.5">
              {unit.paymentHistory.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted text-xs font-mono">{payment.paymentDate}</span>
                  <span>{formatPaymentType(payment.paymentType)}</span>
                  <strong>{currency.format(payment.amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted m-0">Aún no hay pagos registrados.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
