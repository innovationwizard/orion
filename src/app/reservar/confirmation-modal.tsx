"use client";

import { formatCurrency, formatDate, RECEIPT_TYPE_LABELS } from "@/lib/reservas/constants";
import type { UnitFull, ReceiptData, RvReceiptType } from "@/lib/reservas/types";

interface ClientEntry {
  name: string;
  phone: string;
}

interface Props {
  unit: UnitFull;
  salesperson: { display_name: string };
  clients: ClientEntry[];
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
  clients,
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
            <SummaryRow label="Unidad" value={unit.project_slug === "santa-elena" ? unit.unit_number : `${unit.unit_number} — ${unit.tower_name}`} />
            <SummaryRow label="Modelo" value={`${unit.unit_type}${unit.bedrooms > 0 ? ` · ${unit.bedrooms} dorm.` : ""}`} />
            <SummaryRow label="Precio" value={formatCurrency(unit.price_list, unit.currency)} />
            <SummaryRow label="Asesor" value={salesperson.display_name} />
            {/* Buyers */}
            <div className="grid gap-1.5">
              <span className="text-muted text-sm">
                {clients.length > 1 ? "Compradores" : "Comprador"}
              </span>
              {clients.map((c, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2 pl-2">
                  <span className="text-[11px] text-muted shrink-0">
                    {i === 0 ? "Principal" : `Co-comp. ${i}`}
                  </span>
                  <span className="font-medium text-sm text-right">
                    {c.name}
                    {c.phone.trim() ? (
                      <span className="text-muted font-normal"> · {c.phone.trim()}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
            {receipt.depositAmount && (
              <SummaryRow
                label="Monto depósito"
                value={formatCurrency(parseFloat(receipt.depositAmount), unit.currency)}
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
