"use client";

import type { ReceiptExtraction } from "@/lib/reservas/types";
import { CONFIDENCE_LABELS, CONFIDENCE_COLORS, formatCurrency, formatDate } from "@/lib/reservas/constants";

type Props = {
  imageUrl: string | null;
  extractions: ReceiptExtraction[];
  currency?: "GTQ" | "USD";
};

export default function ReceiptViewer({ imageUrl, extractions, currency }: Props) {
  const latest = extractions[0] ?? null;

  return (
    <div className="grid gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Comprobante
      </h4>

      {imageUrl ? (
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Comprobante de pago"
            className="w-full max-h-48 object-contain cursor-pointer"
            onClick={() => window.open(imageUrl, "_blank")}
          />
        </div>
      ) : (
        <p className="text-xs text-muted">Sin imagen de comprobante.</p>
      )}

      {latest && (
        <div className="grid gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Datos OCR</span>
            {latest.confidence && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: CONFIDENCE_COLORS[latest.confidence] }}
              >
                {CONFIDENCE_LABELS[latest.confidence]}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {latest.extracted_amount != null && (
              <>
                <span className="text-muted">Monto</span>
                <span>{formatCurrency(latest.extracted_amount, currency)}</span>
              </>
            )}
            {latest.extracted_date && (
              <>
                <span className="text-muted">Fecha</span>
                <span>{formatDate(latest.extracted_date)}</span>
              </>
            )}
            {latest.extracted_bank && (
              <>
                <span className="text-muted">Banco</span>
                <span>{latest.extracted_bank}</span>
              </>
            )}
            {latest.extracted_ref && (
              <>
                <span className="text-muted">Ref.</span>
                <span>{latest.extracted_ref}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
