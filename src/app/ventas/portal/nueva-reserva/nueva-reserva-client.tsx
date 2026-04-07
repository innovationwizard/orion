"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useVentasContext } from "@/lib/reservas/ventas-context";
import { useUnits } from "@/hooks/use-units";
import { useOfflineQueue } from "@/app/reservar/use-offline-queue";
import ConfirmationModal from "@/app/reservar/confirmation-modal";
import ReceiptPreview from "@/app/reservar/receipt-preview";
import DesktopFileInput from "./desktop-file-input";
import { uploadImage } from "@/lib/reservas/upload-image";
import type {
  UnitFull,
  OcrExtractionResult,
  DpiExtractionResult,
  ReceiptData,
} from "@/lib/reservas/types";
import {
  GUATEMALAN_BANKS,
  RECEIPT_TYPE_LABELS,
  formatCurrency,
} from "@/lib/reservas/constants";

const DRAFT_KEY_PREFIX = "orion:reservation-draft:";

function getInitialParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

interface ClientEntry {
  name: string;
  phone: string;
}

interface FormState {
  clients: ClientEntry[];
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
  clients: [{ name: "", phone: "" }],
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

export default function NuevaReservaClient() {
  const { salesperson, projects } = useVentasContext();
  const { online, queueSize, enqueue } = useOfflineQueue();

  // Unit selection
  const unitIdParam = getInitialParam("unit");
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState(unitIdParam);

  const { data: units, loading: unitsLoading } = useUnits({
    project: selectedProjectSlug || undefined,
    tower: selectedTowerId || undefined,
    status: "AVAILABLE",
  });

  // Find the selected unit
  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return null;
    return units.find((u) => u.id === selectedUnitId) ?? null;
  }, [units, selectedUnitId]);

  // If unit came from URL param but not yet in units list, fetch all and find it
  const [preloadedUnit, setPreloadedUnit] = useState<UnitFull | null>(null);
  useEffect(() => {
    if (!unitIdParam || selectedUnit) return;
    // Try to find the unit across all projects
    fetch(`/api/reservas/units`)
      .then((r) => r.json())
      .then((allUnits: UnitFull[]) => {
        const found = allUnits.find((u) => u.id === unitIdParam);
        if (found) setPreloadedUnit(found);
      })
      .catch(() => {});
  }, [unitIdParam, selectedUnit]);

  const unit = selectedUnit ?? preloadedUnit;

  // Towers for selected project
  const towers = useMemo(() => {
    if (!selectedProjectSlug) return [];
    const project = projects.find((p) => p.slug === selectedProjectSlug);
    return project?.towers ?? [];
  }, [projects, selectedProjectSlug]);

  // Available units for selector
  const availableUnits = useMemo(
    () => units.filter((u) => u.status === "AVAILABLE"),
    [units],
  );

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [showAllLeadSources, setShowAllLeadSources] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const draftKey = unit ? `${DRAFT_KEY_PREFIX}${unit.id}` : null;

  // Restore draft (handles old clientNames+clientPhone format)
  useEffect(() => {
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        let clients: ClientEntry[] | undefined;
        if (Array.isArray(draft.clients)) {
          clients = draft.clients;
        } else if (Array.isArray(draft.clientNames)) {
          clients = draft.clientNames.map((n: string, i: number) => ({
            name: n,
            phone: i === 0 ? (draft.clientPhone ?? "") : "",
          }));
        }
        setForm((prev) => ({
          ...prev,
          clients: clients ?? prev.clients,
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

  // Auto-save draft
  useEffect(() => {
    if (!draftKey) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            clients: form.clients,
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
    form.clients,
    form.leadSource,
    form.notes,
    form.depositAmount,
    form.depositDate,
    form.depositBank,
    form.receiptType,
    form.depositorName,
  ]);

  // Fetch lead sources from DB
  useEffect(() => {
    fetch("/api/reservas/lead-sources")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { name: string }[]) => setLeadSources(data.map((d) => d.name)))
      .catch(() => {});
  }, []);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Client management
  const updateClient = useCallback(
    (index: number, field: keyof ClientEntry, value: string) => {
      setForm((prev) => {
        const clients = [...prev.clients];
        clients[index] = { ...clients[index], [field]: value };
        return { ...prev, clients };
      });
    },
    [],
  );

  const addClient = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      clients: [...prev.clients, { name: "", phone: "" }],
    }));
  }, []);

  const removeClient = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }));
  }, []);

  // DPI OCR
  const handleDpiFile = useCallback(async (file: File) => {
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
            dpiOcrError:
              "No se pudo leer el CUI. Seleccione una imagen más clara.",
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
  }, []);

  // Receipt OCR
  const handleReceiptFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      receiptFile: file,
      receiptPreviewUrl: url,
      ocrLoading: true,
      ocrExtraction: null,
    }));

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
  }, []);

  // Validation
  const validClients = form.clients.filter((c) => c.name.trim().length > 0);
  const validClientNames = validClients.map((c) => c.name.trim());
  const validClientPhones = validClients.map((c) => c.phone.trim() || null);
  const canSubmit =
    !!unit &&
    validClients.length > 0 &&
    form.dpiFile !== null &&
    form.receiptFile !== null &&
    !!form.dpiCui;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !unit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let dpiUrl: string | null = null;
      let receiptUrl: string | null = null;

      if (form.dpiFile) {
        dpiUrl = await uploadImage(form.dpiFile, "dpi", salesperson.id);
      }
      if (form.receiptFile) {
        receiptUrl = await uploadImage(
          form.receiptFile,
          "receipts",
          salesperson.id,
        );
      }

      if (!dpiUrl || !receiptUrl) {
        throw new Error(
          "Ambas imágenes (DPI y comprobante) son requeridas.",
        );
      }

      const payload = {
        unit_id: unit.id,
        salesperson_id: salesperson.id,
        client_names: validClientNames,
        client_phone: validClientPhones[0] ?? null,
        client_phones: validClientPhones,
        deposit_amount: form.depositAmount
          ? parseFloat(form.depositAmount)
          : null,
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
        if (draftKey) localStorage.removeItem(draftKey);
        setSuccess(true);
        return;
      }

      if (res.ok) {
        if (draftKey) localStorage.removeItem(draftKey);
        setSuccess(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setSubmitError(
          body.error ?? `Error ${res.status}`,
        );
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error al enviar reserva",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    unit,
    form,
    salesperson.id,
    validClientNames,
    validClientPhones,
    enqueue,
    draftKey,
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

  const leadSourcesToShow = showAllLeadSources
    ? leadSources
    : leadSources.slice(0, 6);

  // Success screen
  if (success) {
    return (
      <div className="grid gap-6 max-w-lg mx-auto py-12 text-center">
        <div className="text-5xl">&#10003;</div>
        <h2 className="text-xl font-bold text-text-primary">
          Reserva enviada
        </h2>
        <p className="text-sm text-muted">
          La reserva de la unidad {unit?.unit_number} ha sido registrada
          exitosamente.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/ventas/portal/nueva-reserva"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary/90 transition-colors"
          >
            Reservar otra unidad
          </a>
          <a
            href="/ventas/portal/reservas"
            className="px-4 py-2 rounded-lg border border-border text-text-primary text-sm font-medium no-underline hover:bg-bg transition-colors"
          >
            Ver mis reservas
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Nueva Reserva
          </h2>
          <p className="text-xs text-muted">{salesperson.display_name}</p>
        </div>
        {!online && (
          <div className="px-2 py-1 rounded-lg bg-warning/15 text-warning text-xs font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />
            Sin conexión {queueSize > 0 ? `(${queueSize})` : ""}
          </div>
        )}
      </div>

      {/* Unit selector (if no unit pre-selected) */}
      {!unit && (
        <div className="bg-card rounded-2xl border border-border p-5 grid gap-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Seleccionar unidad
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-muted">Proyecto</label>
              <select
                className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedProjectSlug}
                onChange={(e) => {
                  setSelectedProjectSlug(e.target.value);
                  setSelectedTowerId("");
                  setSelectedUnitId("");
                }}
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {towers.length > 1 && (
              <div className="grid gap-1">
                <label className="text-xs text-muted">Torre</label>
                <select
                  className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedTowerId}
                  onChange={(e) => {
                    setSelectedTowerId(e.target.value);
                    setSelectedUnitId("");
                  }}
                >
                  <option value="">Todas las torres</option>
                  {towers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-1">
              <label className="text-xs text-muted">Unidad disponible</label>
              <select
                className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={unitsLoading}
              >
                <option value="">
                  {unitsLoading
                    ? "Cargando..."
                    : `Seleccionar (${availableUnits.length})`}
                </option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number} — {u.unit_type}{u.bedrooms > 0 ? ` · ${u.bedrooms} dorm.` : ""} ·{" "}
                    {formatCurrency(u.price_list, u.currency)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout when unit is selected */}
      {unit && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* Left column — Unit info */}
          <div className="bg-card rounded-2xl border border-border p-5 grid gap-3 self-start lg:sticky lg:top-6">
            <h3 className="text-sm font-semibold text-text-primary">
              {unit.unit_number}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted">Proyecto</span>
              <span className="font-medium">{unit.project_name}</span>
              <span className="text-muted">Torre</span>
              <span className="font-medium">{unit.tower_name}</span>
              <span className="text-muted">Tipo</span>
              <span className="font-medium">
                {unit.unit_type}{unit.bedrooms > 0 ? ` · ${unit.bedrooms} dorm.` : ""}
              </span>
              {unit.area_total && (
                <>
                  <span className="text-muted">Área</span>
                  <span className="font-medium">{unit.area_total} m²</span>
                </>
              )}
              {unit.area_lot ? (
                <>
                  <span className="text-muted">Terreno</span>
                  <span className="font-medium">{unit.area_lot} m²</span>
                </>
              ) : null}
              <span className="text-muted">Precio</span>
              <span className="font-medium">
                {formatCurrency(unit.price_list, unit.currency)}
              </span>
            </div>
            {!unitIdParam && (
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline text-left"
                onClick={() => {
                  setSelectedUnitId("");
                  setPreloadedUnit(null);
                  setForm(INITIAL_STATE);
                }}
              >
                Cambiar unidad
              </button>
            )}
          </div>

          {/* Right column — Form */}
          <div className="grid gap-5">
            {/* Photos */}
            <fieldset className="grid gap-4">
              <legend className="text-sm font-semibold text-text-primary mb-1">
                Documentos
              </legend>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* DPI */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted">
                    DPI del cliente{" "}
                    <span className="text-red-500">*</span>
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
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              dpiFile: null,
                              dpiPreviewUrl: null,
                              dpiCui: null,
                              dpiBirthDate: null,
                              dpiOcrLoading: false,
                              dpiOcrError: null,
                            }))
                          }
                        >
                          &times;
                        </button>
                      </div>
                      {form.dpiCui && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-700 text-xs font-medium">
                          CUI: {form.dpiCui}
                        </div>
                      )}
                      {form.dpiOcrError && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
                          {form.dpiOcrError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <DesktopFileInput
                      label="Subir DPI"
                      onFile={handleDpiFile}
                    />
                  )}
                </div>

                {/* Receipt */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted">
                    Comprobante de pago{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {form.receiptPreviewUrl && form.ocrExtraction ? (
                    <div className="relative">
                      <ReceiptPreview
                        extraction={form.ocrExtraction}
                        imageUrl={form.receiptPreviewUrl}
                        currency={unit?.currency}
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                        onClick={() => {
                          update("receiptFile", null);
                          update("receiptPreviewUrl", null);
                          update("ocrExtraction", null);
                        }}
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
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <DesktopFileInput
                      label="Subir comprobante"
                      onFile={handleReceiptFile}
                    />
                  )}
                </div>
              </div>
            </fieldset>

            {/* Client info */}
            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold text-text-primary mb-1">
                Compradores
              </legend>
              {form.clients.map((client, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-3 grid gap-2 relative"
                >
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                    {i === 0 ? "Comprador principal" : `Co-comprador ${i}`}
                  </span>
                  {i > 0 && (
                    <button
                      type="button"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-red-500/10 text-red-500 text-xs flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      onClick={() => removeClient(i)}
                      aria-label={`Eliminar co-comprador ${i}`}
                    >
                      &times;
                    </button>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={client.name}
                      onChange={(e) => updateClient(i, "name", e.target.value)}
                      className="px-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono (opcional)"
                      value={client.phone}
                      onChange={(e) => updateClient(i, "phone", e.target.value)}
                      className="px-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline text-left"
                onClick={addClient}
              >
                + Agregar co-comprador
              </button>
            </fieldset>

            {/* Deposit data */}
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
                  <label className="text-xs text-muted">Monto ({unit?.currency === "USD" ? "$" : "Q"})</label>
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
                  <label className="text-xs text-muted">
                    Tipo de comprobante
                  </label>
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

            {/* Lead source */}
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
                      update(
                        "leadSource",
                        form.leadSource === src ? "" : src,
                      )
                    }
                  >
                    {src}
                  </button>
                ))}
              </div>
              {!showAllLeadSources && leadSources.length > 6 && (
                <button
                  type="button"
                  className="text-xs text-primary font-medium hover:underline text-left"
                  onClick={() => setShowAllLeadSources(true)}
                >
                  Ver todas ({leadSources.length})
                </button>
              )}
            </fieldset>

            {/* Notes */}
            <div className="grid gap-1">
              <label className="text-sm font-semibold text-text-primary">
                Notas (opcional)
              </label>
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
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmation && unit && (
        <ConfirmationModal
          unit={unit}
          salesperson={salesperson}
          clients={validClients}
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
