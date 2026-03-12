"use client";

import { formatCurrency, formatDate, RECEIPT_TYPE_LABELS } from "@/lib/reservas/constants";
import type { UnitFull, ReceiptData, RvReceiptType } from "@/lib/reservas/types";

interface Props {
  unit: UnitFull;
  salesperson: { display_name: string };
  clientNames: string[];
  clientPhone: string;
  receipt: ReceiptData;
  leadSource: string;
  notes: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  unit,
  salesperson,
  clientNames,
  clientPhone,
  receipt,
  leadSource,
  notes,
  submitting,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={submitting ? undefined : onClose}
      />

      {/* Modal content */}
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl border border-border">
        <div className="p-6 grid gap-4">
          <h2 className="text-lg font-bold text-text-primary">Confirmar reserva</h2>

          {/* Summary */}
          <div className="grid gap-3 text-sm">
            <SummaryRow label="Unidad" value={`${unit.unit_number} — ${unit.tower_name}`} />
            <SummaryRow label="Modelo" value={`${unit.unit_type} · ${unit.bedrooms} dorm.`} />
            <SummaryRow label="Precio" value={formatCurrency(unit.price_list)} />
            <SummaryRow label="Asesor" value={salesperson.display_name} />
            <SummaryRow
              label={clientNames.length > 1 ? "Clientes" : "Cliente"}
              value={clientNames.join(", ")}
            />
            {clientPhone && <SummaryRow label="Teléfono" value={clientPhone} />}
            {receipt.depositAmount && (
              <SummaryRow
                label="Monto depósito"
                value={formatCurrency(parseFloat(receipt.depositAmount))}
              />
            )}
            {receipt.depositDate && (
              <SummaryRow label="Fecha depósito" value={formatDate(receipt.depositDate)} />
            )}
            {receipt.depositBank && (
              <SummaryRow label="Banco" value={receipt.depositBank} />
            )}
            {receipt.receiptType && (
              <SummaryRow
                label="Tipo comprobante"
                value={
                  RECEIPT_TYPE_LABELS[receipt.receiptType as RvReceiptType] ??
                  receipt.receiptType
                }
              />
            )}
            {receipt.depositorName && (
              <SummaryRow label="Depositante" value={receipt.depositorName} />
            )}
            {leadSource && <SummaryRow label="Fuente" value={leadSource} />}
            {notes.trim() && <SummaryRow label="Notas" value={notes} />}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              className="py-3 rounded-lg border border-border bg-card text-text-primary font-medium text-sm hover:bg-border/50 transition-colors disabled:opacity-40"
              onClick={onClose}
            >
              Editar
            </button>
            <button
              type="button"
              disabled={submitting}
              className="py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
              onClick={onConfirm}
            >
              {submitting ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
