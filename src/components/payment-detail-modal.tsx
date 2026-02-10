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

  const rows = [
    {
      label: "Enganche total",
      expected: unit.engancheTotal.expected,
      paid: unit.engancheTotal.paid
    },
    {
      label: "Reserva",
      expected: unit.reserve.expected,
      paid: unit.reserve.paid
    },
    {
      label: "Enganche fraccionado",
      expected: unit.downPayment.expected,
      paid: unit.downPayment.paid
    },
    unit.installments.expected > 0 || unit.installments.paid > 0
      ? {
          label: "Cuotas",
          expected: unit.installments.expected,
          paid: unit.installments.paid
        }
      : null,
    {
      label: "Total",
      expected: unit.totalExpected,
      paid: unit.totalPaid
    }
  ].filter(Boolean) as Array<{ label: string; expected: number; paid: number }>;

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Detalle de pagos</h3>
            <p className="muted">
              Unidad {unit.unitNumber} · {unit.clientName}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="modal-tiers-hint">
          Enganche total = Reserva + Enganche fraccionado (este último se paga en mensualidades).
        </p>
        <div className="modal-table">
          <div className="table-head">
            <span>Concepto</span>
            <span>Esperado</span>
            <span>Pagado</span>
            <span>Diferencia</span>
          </div>
          {rows.map((row) => {
            const diff = row.expected - row.paid;
            return (
              <div className="table-row" key={row.label}>
                <span>{row.label}</span>
                <span>{currency.format(row.expected)}</span>
                <span>{currency.format(row.paid)}</span>
                <span className={diff <= 0 ? "positive" : "negative"}>
                  {currency.format(diff)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="timeline">
          <h4>Historial de pagos</h4>
          {unit.paymentHistory.length ? (
            <ul>
              {unit.paymentHistory.map((payment) => (
                <li key={payment.id}>
                  <span className="timeline-date">{payment.paymentDate}</span>
                  <span>{formatPaymentType(payment.paymentType)}</span>
                  <strong>{currency.format(payment.amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aún no hay pagos registrados.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
