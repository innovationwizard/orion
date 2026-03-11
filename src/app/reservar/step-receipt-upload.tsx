"use client";

import { useState } from "react";
import type { OcrExtractionResult, RvReceiptType } from "@/lib/reservas/types";
import { RECEIPT_TYPE_LABELS, GUATEMALAN_BANKS } from "@/lib/reservas/constants";
import CameraInput from "./camera-input";
import ReceiptPreview from "./receipt-preview";

export type ReceiptData = {
  imageUrl: string | null;
  receiptFile: File | null;
  extraction: OcrExtractionResult | null;
  depositAmount: string;
  depositDate: string;
  depositBank: string;
  receiptType: RvReceiptType | "";
  depositorName: string;
};

type Props = {
  initial: ReceiptData;
  onNext: (data: ReceiptData) => void;
  onBack: () => void;
};

export default function StepReceiptUpload({ initial, onNext, onBack }: Props) {
  const [data, setData] = useState<ReceiptData>(initial);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setData((prev) => ({ ...prev, imageUrl: url, receiptFile: file }));
    setOcrError(null);
    setOcrLoading(true);

    try {
      const form = new FormData();
      form.append("receipt", file);
      const res = await fetch("/api/reservas/ocr", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error de OCR" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const extraction: OcrExtractionResult = await res.json();
      setData((prev) => ({
        ...prev,
        extraction,
        depositAmount: extraction.amount != null ? String(extraction.amount) : prev.depositAmount,
        depositDate: extraction.date ?? prev.depositDate,
        depositBank: extraction.bank ?? prev.depositBank,
        receiptType: extraction.receipt_type ?? prev.receiptType,
        depositorName: extraction.depositor_name ?? prev.depositorName,
      }));
    } catch (e: unknown) {
      setOcrError(e instanceof Error ? e.message : "Error procesando comprobante");
    } finally {
      setOcrLoading(false);
    }
  }

  function handleNext() {
    onNext(data);
  }

  return (
    <div className="grid gap-5">
      <h2 className="text-lg font-bold text-text-primary">Comprobante de pago</h2>

      <CameraInput onFile={handleFile} disabled={ocrLoading} />

      {ocrLoading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Procesando comprobante...
        </div>
      )}

      {ocrError && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">{ocrError}</div>
      )}

      {data.extraction && data.imageUrl && (
        <ReceiptPreview extraction={data.extraction} imageUrl={data.imageUrl} />
      )}

      {/* Manual override fields */}
      <div className="grid gap-3">
        <p className="text-xs text-muted">Puede corregir los datos extraídos manualmente:</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted">Monto</label>
            <input
              type="number"
              inputMode="numeric"
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="0.00"
              value={data.depositAmount}
              onChange={(e) => setData((p) => ({ ...p, depositAmount: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted">Fecha</label>
            <input
              type="date"
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={data.depositDate}
              onChange={(e) => setData((p) => ({ ...p, depositDate: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted">Banco</label>
            <select
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={data.depositBank}
              onChange={(e) => setData((p) => ({ ...p, depositBank: e.target.value }))}
            >
              <option value="">Seleccionar banco</option>
              {GUATEMALAN_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted">Tipo de comprobante</label>
            <select
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={data.receiptType}
              onChange={(e) => setData((p) => ({ ...p, receiptType: e.target.value as RvReceiptType }))}
            >
              <option value="">Seleccionar tipo</option>
              {(Object.entries(RECEIPT_TYPE_LABELS) as [RvReceiptType, string][]).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium text-muted">Nombre del depositante</label>
          <input
            type="text"
            className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Nombre completo"
            value={data.depositorName}
            onChange={(e) => setData((p) => ({ ...p, depositorName: e.target.value }))}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 py-3 rounded-lg border border-border text-muted font-medium text-sm hover:bg-bg transition-colors"
          onClick={onBack}
        >
          Atrás
        </button>
        <button
          type="button"
          className="flex-1 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
          onClick={handleNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
