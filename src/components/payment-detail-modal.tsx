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

        {isCompliance && statusLabel != null && (
          <p className="modal-tiers-hint">
            Estado: <strong>{statusLabel}</strong>
            {unit.daysDelinquent != null && unit.daysDelinquent > 0 && (
              <> · {unit.daysDelinquent} días en mora</>
            )}
          </p>
        )}
        {!isCompliance && (
          <p className="modal-tiers-hint">
            Enganche total = Reserva + Enganche fraccionado (este último se paga en mensualidades).
          </p>
        )}
        <div className="modal-table">
          <div className="table-head">
            <span>Concepto</span>
            <span>Esperado</span>
            <span>Cobrado</span>
            <span>Diferencia</span>
          </div>
          {rows.map((row) => {
            const diff = row.paid - row.expected;
            return (
              <div className="table-row" key={row.label}>
                <span>{row.label}</span>
                <span>{currency.format(row.expected)}</span>
                <span>{currency.format(row.paid)}</span>
                <span className={diff >= 0 ? "positive" : "negative"}>
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
