"use client";

import { useState } from "react";
import type { UnitFull } from "@/lib/reservas/types";
import type { RvReceiptType } from "@/lib/reservas/types";
import { formatCurrency, RECEIPT_TYPE_LABELS } from "@/lib/reservas/constants";
import type { ReceiptData } from "./step-receipt-upload";

type Props = {
  unit: UnitFull | null;
  salespersonName: string;
  clientNames: string[];
  clientPhone: string;
  leadSource: string;
  receipt: ReceiptData;
  unitId: string;
  salespersonId: string;
  enqueue: (url: string, options: { method: string; body: string }) => Promise<Response | null>;
  onBack: () => void;
  onSuccess: () => void;
};

export default function StepReviewSubmit({
  unit,
  salespersonName,
  clientNames,
  clientPhone,
  leadSource,
  receipt,
  unitId,
  salespersonId,
  enqueue,
  onBack,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const body = JSON.stringify({
        unit_id: unitId,
        salesperson_id: salespersonId,
        client_names: clientNames,
        client_phone: clientPhone || null,
        deposit_amount: receipt.depositAmount ? Number(receipt.depositAmount) : null,
        deposit_date: receipt.depositDate || null,
        deposit_bank: receipt.depositBank || null,
        receipt_type: (receipt.receiptType as RvReceiptType) || null,
        depositor_name: receipt.depositorName || null,
        receipt_image_url: null,
        lead_source: leadSource || null,
        notes: null,
      });

      const res = await enqueue("/api/reservas/reservations", { method: "POST", body });

      // null means it was queued offline — treat as success
      if (res === null) {
        onSuccess();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error al enviar" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al enviar reserva");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <h2 className="text-lg font-bold text-text-primary">Confirmar reserva</h2>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border p-4 grid gap-4">
        {/* Unit */}
        <Section title="Unidad">
          <Row label="Unidad" value={unit?.unit_number ?? "—"} />
          <Row label="Proyecto" value={unit?.project_name ?? "—"} />
          <Row label="Torre" value={unit?.tower_name ?? "—"} />
          <Row label="Tipo" value={unit ? `${unit.unit_type} · ${unit.bedrooms} dorm.` : "—"} />
          <Row label="Precio" value={formatCurrency(unit?.price_list ?? null)} />
          <Row label="Asesor" value={salespersonName} />
        </Section>

        {/* Client */}
        <Section title="Cliente">
          {clientNames.map((n, i) => (
            <Row key={i} label={clientNames.length > 1 ? `Cliente ${i + 1}` : "Nombre"} value={n} />
          ))}
          {clientPhone && <Row label="Teléfono" value={clientPhone} />}
          {leadSource && <Row label="Fuente" value={leadSource} />}
        </Section>

        {/* Receipt */}
        <Section title="Comprobante">
          {receipt.depositAmount && (
            <Row label="Monto" value={formatCurrency(Number(receipt.depositAmount))} />
          )}
          {receipt.depositDate && <Row label="Fecha" value={receipt.depositDate} />}
          {receipt.depositBank && <Row label="Banco" value={receipt.depositBank} />}
          {receipt.receiptType && (
            <Row label="Tipo" value={RECEIPT_TYPE_LABELS[receipt.receiptType as RvReceiptType] ?? receipt.receiptType} />
          )}
          {receipt.depositorName && <Row label="Depositante" value={receipt.depositorName} />}
          {receipt.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receipt.imageUrl} alt="Comprobante" className="w-full max-h-32 object-contain" />
            </div>
          )}
        </Section>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={submitting}
          className="flex-1 py-3 rounded-lg border border-border text-muted font-medium text-sm hover:bg-bg transition-colors disabled:opacity-40"
          onClick={onBack}
        >
          Atrás
        </button>
        <button
          type="button"
          disabled={submitting}
          className="flex-1 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-40"
          onClick={handleSubmit}
        >
          {submitting ? "Enviando..." : "Enviar reserva"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </>
  );
}
