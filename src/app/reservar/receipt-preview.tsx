"use client";

import type { OcrExtractionResult } from "@/lib/reservas/types";
import { CONFIDENCE_LABELS, CONFIDENCE_COLORS, RECEIPT_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/reservas/constants";

type Props = {
  extraction: OcrExtractionResult;
  imageUrl: string;
};

export default function ReceiptPreview({ extraction, imageUrl }: Props) {
  const confidence = extraction.confidence;

  return (
    <div className="grid gap-4">
      {/* Image preview */}
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Comprobante de pago"
          className="w-full max-h-48 object-contain"
        />
      </div>

      {/* OCR results */}
      <div className="bg-card rounded-xl border border-border p-4 grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Datos extraídos</span>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: CONFIDENCE_COLORS[confidence] }}
          >
            {CONFIDENCE_LABELS[confidence]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {extraction.amount != null && (
            <>
              <span className="text-muted">Monto</span>
              <span className="font-medium">{formatCurrency(extraction.amount)}</span>
            </>
          )}
          {extraction.date && (
            <>
              <span className="text-muted">Fecha</span>
              <span className="font-medium">{formatDate(extraction.date)}</span>
            </>
          )}
          {extraction.bank && (
            <>
              <span className="text-muted">Banco</span>
              <span className="font-medium">{extraction.bank}</span>
            </>
          )}
          {extraction.reference_number && (
            <>
              <span className="text-muted">Referencia</span>
              <span className="font-medium">{extraction.reference_number}</span>
            </>
          )}
          {extraction.depositor_name && (
            <>
              <span className="text-muted">Depositante</span>
              <span className="font-medium">{extraction.depositor_name}</span>
            </>
          )}
          {extraction.receipt_type && (
            <>
              <span className="text-muted">Tipo</span>
              <span className="font-medium">{RECEIPT_TYPE_LABELS[extraction.receipt_type]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
