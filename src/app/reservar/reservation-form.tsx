"use client";

import { useCallback, useEffect, useState } from "react";
import CameraInput from "./camera-input";
import ReceiptPreview from "./receipt-preview";
import ConfirmationModal from "./confirmation-modal";
import { LEAD_SOURCES, GUATEMALAN_BANKS, RECEIPT_TYPE_LABELS, formatCurrency } from "@/lib/reservas/constants";
import { uploadImage } from "@/lib/reservas/upload-image";
import type { UnitFull, OcrExtractionResult, DpiExtractionResult, ReceiptData } from "@/lib/reservas/types";

const TOP_LEAD_SOURCES = ["Facebook", "Referido", "Perfilan", "Visita Inédita", "Señalética", "Web"] as const;
const DRAFT_KEY_PREFIX = "orion:reservation-draft:";

interface Props {
  unit: UnitFull;
  salesperson: { id: string; full_name: string; display_name: string };
  enqueue: (url: string, options: { method: string; body: string }) => Promise<Response | null>;
  online: boolean;
  queueSize: number;
  onBack: () => void;
  onSuccess: () => void;
}

interface FormState {
  clientNames: string[];
  clientPhone: string;
  leadSource: string;
  notes: string;
  dpiFile: File | null;
  dpiPreviewUrl: string | null;
  dpiCui: string | null;
  dpiBirthDate: string | null;
  dpiOcrLoading: boolean;
  dpiOcrError: string | null;
  receiptFile: File | null;
  receiptPreviewUrl: string | null;
  ocrExtraction: OcrExtractionResult | null;
  ocrLoading: boolean;
  depositAmount: string;
  depositDate: string;
  depositBank: string;
  receiptType: string;
  depositorName: string;
}

const INITIAL_STATE: FormState = {
  clientNames: [""],
  clientPhone: "",
  leadSource: "",
  notes: "",
  dpiFile: null,
  dpiPreviewUrl: null,
  dpiCui: null,
  dpiBirthDate: null,
  dpiOcrLoading: false,
  dpiOcrError: null,
  receiptFile: null,
  receiptPreviewUrl: null,
  ocrExtraction: null,
  ocrLoading: false,
  depositAmount: "",
  depositDate: "",
  depositBank: "",
  receiptType: "",
  depositorName: "",
};

export default function ReservationForm({
  unit,
  salesperson,
  enqueue,
  online,
  queueSize,
  onBack,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [showAllLeadSources, setShowAllLeadSources] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${unit.id}`;

  // Restore draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setForm((prev) => ({
          ...prev,
          clientNames: draft.clientNames ?? prev.clientNames,
          clientPhone: draft.clientPhone ?? prev.clientPhone,
          leadSource: draft.leadSource ?? prev.leadSource,
          notes: draft.notes ?? prev.notes,
          depositAmount: draft.depositAmount ?? prev.depositAmount,
          depositDate: draft.depositDate ?? prev.depositDate,
          depositBank: draft.depositBank ?? prev.depositBank,
          receiptType: draft.receiptType ?? prev.receiptType,
          depositorName: draft.depositorName ?? prev.depositorName,
        }));
      }
    } catch {
      // ignore
    }
  }, [draftKey]);

  // Auto-save draft (text fields only, not files)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            clientNames: form.clientNames,
            clientPhone: form.clientPhone,
            leadSource: form.leadSource,
            notes: form.notes,
            depositAmount: form.depositAmount,
            depositDate: form.depositDate,
            depositBank: form.depositBank,
            receiptType: form.receiptType,
            depositorName: form.depositorName,
          }),
        );
      } catch {
        // ignore
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    draftKey,
    form.clientNames,
    form.clientPhone,
    form.leadSource,
    form.notes,
    form.depositAmount,
    form.depositDate,
    form.depositBank,
    form.receiptType,
    form.depositorName,
  ]);

  // Update a specific field
  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Client name management
  const updateClientName = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const names = [...prev.clientNames];
      names[index] = value;
      return { ...prev, clientNames: names };
    });
  }, []);

  const addClient = useCallback(() => {
    setForm((prev) => ({ ...prev, clientNames: [...prev.clientNames, ""] }));
  }, []);

  const removeClient = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      clientNames: prev.clientNames.filter((_, i) => i !== index),
    }));
  }, []);

  // DPI photo + OCR extraction
  const handleDpiFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        dpiFile: file,
        dpiPreviewUrl: url,
        dpiCui: null,
        dpiBirthDate: null,
        dpiOcrLoading: true,
        dpiOcrError: null,
      }));

      // Run DPI OCR in background
      try {
        const formData = new FormData();
        formData.append("dpi", file);
        const res = await fetch("/api/reservas/dpi-ocr", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const extraction: DpiExtractionResult = await res.json();
          if (extraction.cui) {
            setForm((prev) => ({
              ...prev,
              dpiCui: extraction.cui,
              dpiBirthDate: extraction.birth_date ?? null,
              dpiOcrLoading: false,
              dpiOcrError: null,
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              dpiOcrLoading: false,
              dpiOcrError: "No se pudo leer el CUI. Tome otra foto más clara.",
            }));
          }
        } else {
          setForm((prev) => ({
            ...prev,
            dpiOcrLoading: false,
            dpiOcrError: "Error al analizar DPI. Intente de nuevo.",
          }));
        }
      } catch {
        setForm((prev) => ({
          ...prev,
          dpiOcrLoading: false,
          dpiOcrError: "Error de conexión al analizar DPI.",
        }));
      }
    },
    [],
  );

  // Receipt photo + OCR
  const handleReceiptFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        receiptFile: file,
        receiptPreviewUrl: url,
        ocrLoading: true,
        ocrExtraction: null,
      }));

      // Run OCR in background
      try {
        const formData = new FormData();
        formData.append("receipt", file);
        const res = await fetch("/api/reservas/ocr", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const extraction: OcrExtractionResult = await res.json();
          setForm((prev) => ({
            ...prev,
            ocrExtraction: extraction,
            ocrLoading: false,
            depositAmount: extraction.amount?.toString() ?? prev.depositAmount,
            depositDate: extraction.date ?? prev.depositDate,
            depositBank: extraction.bank ?? prev.depositBank,
            receiptType: extraction.receipt_type ?? prev.receiptType,
            depositorName: extraction.depositor_name ?? prev.depositorName,
          }));
        } else {
          setForm((prev) => ({ ...prev, ocrLoading: false }));
        }
      } catch {
        setForm((prev) => ({ ...prev, ocrLoading: false }));
      }
    },
    [],
  );

  // Validation
  const validClientNames = form.clientNames.filter((n) => n.trim().length > 0);
  const canSubmit =
    validClientNames.length > 0 &&
    form.dpiFile !== null &&
    form.receiptFile !== null &&
    !!form.dpiCui;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload images
      let dpiUrl: string | null = null;
      let receiptUrl: string | null = null;

      if (form.dpiFile) {
        dpiUrl = await uploadImage(form.dpiFile, "dpi", salesperson.id);
      }
      if (form.receiptFile) {
        receiptUrl = await uploadImage(form.receiptFile, "receipts", salesperson.id);
      }

      if (!dpiUrl || !receiptUrl) {
        throw new Error("Ambas imágenes (DPI y comprobante) son requeridas.");
      }

      const payload = {
        unit_id: unit.id,
        salesperson_id: salesperson.id,
        client_names: validClientNames,
        client_phone: form.clientPhone.trim() || null,
        deposit_amount: form.depositAmount ? parseFloat(form.depositAmount) : null,
        deposit_date: form.depositDate || null,
        deposit_bank: form.depositBank || null,
        receipt_type: form.receiptType || null,
        depositor_name: form.depositorName.trim() || null,
        receipt_image_url: receiptUrl,
        dpi_image_url: dpiUrl,
        client_dpi: form.dpiCui,
        client_birth_date: form.dpiBirthDate,
        lead_source: form.leadSource || null,
        notes: form.notes.trim() || null,
      };

      const res = await enqueue("/api/reservas/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res === null) {
        // Queued offline — treat as success
        localStorage.removeItem(draftKey);
        onSuccess();
        return;
      }

      if (res.ok) {
        localStorage.removeItem(draftKey);
        onSuccess();
      } else {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error ?? `Error ${res.status}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar reserva");
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    form,
    unit.id,
    salesperson.id,
    validClientNames,
    enqueue,
    draftKey,
    onSuccess,
  ]);

  const receiptData: ReceiptData = {
    imageUrl: form.receiptPreviewUrl,
    receiptFile: form.receiptFile,
    extraction: form.ocrExtraction,
    depositAmount: form.depositAmount,
    depositDate: form.depositDate,
    depositBank: form.depositBank,
    receiptType: form.receiptType,
    depositorName: form.depositorName,
  };

  const leadSourcesToShow = showAllLeadSources ? LEAD_SOURCES : TOP_LEAD_SOURCES;

  return (
    <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-5">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="shrink-0 w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:text-text-primary transition-colors"
          onClick={onBack}
          aria-label="Volver"
        >
          &larr;
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary truncate">
            Reservar {unit.unit_number}
          </h1>
          <p className="text-xs text-muted">{salesperson.display_name}</p>
        </div>
        {!online && (
          <div className="ml-auto shrink-0 px-2 py-1 rounded-lg bg-warning/15 text-warning text-xs font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />
            {queueSize > 0 ? queueSize : ""}
          </div>
        )}
      </div>

      {/* Unit info badge (auto-populated, read-only) */}
      <div className="bg-card rounded-xl border border-border p-4 text-sm grid grid-cols-2 gap-2">
        <span className="text-muted">Unidad</span>
        <span className="font-medium">{unit.unit_number}</span>
        <span className="text-muted">Modelo</span>
        <span className="font-medium">{unit.unit_type} · {unit.bedrooms} dorm.</span>
        {unit.area_total ? (
          <>
            <span className="text-muted">Área</span>
            <span className="font-medium">{unit.area_total} m²</span>
          </>
        ) : null}
        <span className="text-muted">Precio</span>
        <span className="font-medium">{formatCurrency(unit.price_list)}</span>
        <span className="text-muted">Torre</span>
        <span className="font-medium">{unit.tower_name}</span>
      </div>

      {/* Section 1: Photos */}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-text-primary mb-1">Fotos</legend>

        {/* DPI */}
        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted">
            DPI del cliente <span className="text-red-500">*</span>
          </label>
          {form.dpiPreviewUrl ? (
            <div className="grid gap-1.5">
              <div className="rounded-xl overflow-hidden border border-border bg-card relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.dpiPreviewUrl}
                  alt="DPI"
                  className="w-full max-h-40 object-contain"
                />
                {form.dpiOcrLoading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-xs text-white font-medium animate-pulse">
                      Extrayendo CUI...
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      dpiFile: null,
                      dpiPreviewUrl: null,
                      dpiCui: null,
                      dpiBirthDate: null,
                      dpiOcrLoading: false,
                      dpiOcrError: null,
                    }));
                  }}
                  aria-label="Eliminar foto DPI"
                >
                  &times;
                </button>
              </div>
              {form.dpiCui && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-700 text-xs font-medium">
                  <span>CUI: {form.dpiCui}</span>
                </div>
              )}
              {form.dpiOcrError && (
                <div className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
                  {form.dpiOcrError}
                </div>
              )}
            </div>
          ) : (
            <CameraInput onFile={handleDpiFile} />
          )}
        </div>

        {/* Receipt */}
        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted">
            Comprobante de pago <span className="text-red-500">*</span>
          </label>
          {form.receiptPreviewUrl && form.ocrExtraction ? (
            <div className="relative">
              <ReceiptPreview
                extraction={form.ocrExtraction}
                imageUrl={form.receiptPreviewUrl}
              />
              <button
                type="button"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                onClick={() => {
                  update("receiptFile", null);
                  update("receiptPreviewUrl", null);
                  update("ocrExtraction", null);
                }}
                aria-label="Eliminar comprobante"
              >
                &times;
              </button>
            </div>
          ) : form.receiptPreviewUrl ? (
            <div className="rounded-xl overflow-hidden border border-border bg-card relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.receiptPreviewUrl}
                alt="Comprobante"
                className="w-full max-h-40 object-contain"
              />
              {form.ocrLoading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-xs text-white font-medium animate-pulse">
                    Analizando...
                  </span>
                </div>
              )}
              <button
                type="button"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                onClick={() => {
                  update("receiptFile", null);
                  update("receiptPreviewUrl", null);
                  update("ocrExtraction", null);
                }}
                aria-label="Eliminar comprobante"
              >
                &times;
              </button>
            </div>
          ) : (
            <CameraInput onFile={handleReceiptFile} />
          )}
        </div>
      </fieldset>

      {/* Section 2: Client info */}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-text-primary mb-1">Datos del cliente</legend>
        {form.clientNames.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder={i === 0 ? "Nombre del cliente *" : "Co-comprador"}
              value={name}
              onChange={(e) => updateClientName(i, e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {i > 0 && (
              <button
                type="button"
                className="shrink-0 w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                onClick={() => removeClient(i)}
                aria-label="Eliminar cliente"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-xs text-primary font-medium hover:underline text-left"
          onClick={addClient}
        >
          + Agregar co-comprador
        </button>
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
          value={form.clientPhone}
          onChange={(e) => update("clientPhone", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </fieldset>

      {/* Section 3: Deposit data */}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-text-primary mb-1">
          Datos del depósito
          {form.ocrLoading && (
            <span className="ml-2 text-xs font-normal text-muted animate-pulse">
              (extrayendo datos...)
            </span>
          )}
        </legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-muted">Monto (Q)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={form.depositAmount}
              onChange={(e) => update("depositAmount", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted">Fecha</label>
            <input
              type="date"
              value={form.depositDate}
              onChange={(e) => update("depositDate", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted">Banco</label>
          <select
            value={form.depositBank}
            onChange={(e) => update("depositBank", e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Seleccionar banco</option>
            {GUATEMALAN_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-muted">Tipo de comprobante</label>
            <select
              value={form.receiptType}
              onChange={(e) => update("receiptType", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleccionar tipo</option>
              {Object.entries(RECEIPT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted">Depositante</label>
            <input
              type="text"
              placeholder="Nombre del depositante"
              value={form.depositorName}
              onChange={(e) => update("depositorName", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </fieldset>

      {/* Section 4: Lead source chips */}
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-text-primary mb-1">
          Fuente de captación
        </legend>
        <div className="flex flex-wrap gap-2">
          {leadSourcesToShow.map((src) => (
            <button
              key={src}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                form.leadSource === src
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-text-primary hover:bg-primary/5"
              }`}
              onClick={() =>
                update("leadSource", form.leadSource === src ? "" : src)
              }
            >
              {src}
            </button>
          ))}
        </div>
        {!showAllLeadSources && (
          <button
            type="button"
            className="text-xs text-primary font-medium hover:underline text-left"
            onClick={() => setShowAllLeadSources(true)}
          >
            Ver todas ({LEAD_SOURCES.length})
          </button>
        )}
      </fieldset>

      {/* Section 5: Notes */}
      <div className="grid gap-1">
        <label className="text-sm font-semibold text-text-primary">Notas (opcional)</label>
        <textarea
          rows={2}
          placeholder="Comentarios adicionales..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
          {submitError}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        disabled={!canSubmit || submitting}
        className="w-full py-3.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => setShowConfirmation(true)}
      >
        {submitting ? "Enviando..." : "Revisar y enviar"}
      </button>

      {/* Confirmation modal */}
      {showConfirmation && (
        <ConfirmationModal
          unit={unit}
          salesperson={salesperson}
          clientNames={validClientNames}
          clientPhone={form.clientPhone}
          receipt={receiptData}
          leadSource={form.leadSource}
          notes={form.notes}
          submitting={submitting}
          onConfirm={handleSubmit}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}
