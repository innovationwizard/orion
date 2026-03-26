"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useUnits } from "@/hooks/use-units";
import { useCotizadorConfigs, useResolvedConfig } from "@/hooks/use-cotizador-config";
import type { UnitFull } from "@/lib/reservas/types";
import {
  computeEnganche,
  computeFinancingMatrix,
  computeEscrituracion,
  computeMantenimiento,
} from "@/lib/reservas/cotizador";
import { formatCurrency, formatDate } from "@/lib/reservas/constants";
import NavBar from "@/components/nav-bar";
import InstallmentTable from "./installment-table";
import FinancingMatrix from "./financing-matrix";
import EscrituracionPanel from "./escrituracion-panel";

export default function CotizadorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get("unit") ?? "";

  const { data: projects } = useProjects();

  const [projectSlug, setProjectSlug] = useState("");
  const [towerId, setTowerId] = useState("");
  const [unitId, setUnitId] = useState(preselectedUnitId);

  const { data: units, loading: unitsLoading } = useUnits({
    project: projectSlug || undefined,
    tower: towerId || undefined,
  });

  // Load per-project cotizador configs
  const { data: configRows } = useCotizadorConfigs(projectSlug || undefined);

  // If preselected unit, detect its project/tower
  const preselectedUnit = useMemo(
    () => (preselectedUnitId ? units.find((u) => u.id === preselectedUnitId) : undefined),
    [units, preselectedUnitId],
  );

  const selectedUnit: UnitFull | null = useMemo(
    () => units.find((u) => u.id === unitId) ?? null,
    [units, unitId],
  );

  // Resolve config for selected unit (tower + unit_type)
  const config = useResolvedConfig(
    configRows,
    selectedUnit?.tower_id ?? null,
    selectedUnit?.unit_type ?? null,
  );

  // Client/salesperson identity (optional, for print output)
  const [clientName, setClientName] = useState("");
  const [salespersonName, setSalespersonName] = useState("");

  // Parameters (user-adjustable, initialized from config)
  const [enganchePctOverride, setEnganchePctOverride] = useState<number | null>(null);
  const [reservaOverride, setReservaOverride] = useState<number | null>(null);
  const [installmentMonthsOverride, setInstallmentMonthsOverride] = useState<number | null>(null);
  const [inmueblePctOverride, setInmueblePctOverride] = useState<number | null>(null);

  const enganchePct = enganchePctOverride ?? config.enganche_pct;
  const reserva = reservaOverride ?? config.reserva_default;
  const installmentMonths = installmentMonthsOverride ?? config.installment_months;
  const inmueblePct = inmueblePctOverride ?? config.inmueble_pct;

  // Computations
  const price = selectedUnit?.price_list ?? 0;

  const enganche = useMemo(
    () => computeEnganche(price, config, enganchePct, reserva, installmentMonths),
    [price, config, enganchePct, reserva, installmentMonths],
  );

  const financing = useMemo(
    () => computeFinancingMatrix(price, enganche.enganche_total, config, selectedUnit?.valor_inmueble ?? null),
    [price, enganche.enganche_total, config, selectedUnit?.valor_inmueble],
  );

  const escrituracion = useMemo(
    () => computeEscrituracion(price, { inmueble_pct: inmueblePct, timbres_rate: config.timbres_rate, use_pretax_extraction: config.use_pretax_extraction }),
    [price, inmueblePct, config.timbres_rate, config.use_pretax_extraction],
  );

  const mantenimiento = useMemo(
    () => computeMantenimiento(selectedUnit?.area_total ?? 0, config.mantenimiento_per_m2),
    [selectedUnit?.area_total, config.mantenimiento_per_m2],
  );

  const currentProject = projects.find((p) => p.project_slug === projectSlug);
  const towers = currentProject?.towers ?? [];

  // Group available units for select
  const availableUnits = useMemo(
    () => units.filter((u) => u.status === "AVAILABLE").sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })),
    [units],
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleProjectChange(slug: string) {
    setProjectSlug(slug);
    setTowerId("");
    setUnitId("");
    // Reset overrides so new project config takes effect
    setEnganchePctOverride(null);
    setReservaOverride(null);
    setInstallmentMonthsOverride(null);
    setInmueblePctOverride(null);
    updateParam("unit", "");
  }

  return (
    <div className="cotizador-page p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[900px] mx-auto">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <NavBar />

      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cotizador</h1>
          <p className="text-sm text-muted mt-1">Calcula enganche, financiamiento y escrituración</p>
        </div>
        <div className="text-xs text-muted text-right">
          <div>Fecha: {new Date().toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" })}</div>
          {config.validity_days > 0 && (
            <div>Válida por {config.validity_days} días</div>
          )}
        </div>
      </header>

      {/* Client & salesperson identity */}
      <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Datos de cotización</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-muted">Nombre del cliente</span>
            <input
              type="text"
              placeholder="Opcional"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted">Asesor</span>
            <input
              type="text"
              placeholder="Opcional"
              value={salespersonName}
              onChange={(e) => setSalespersonName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
      </section>

      {/* Unit selector */}
      <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Seleccionar unidad</h2>
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={projectSlug}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            <option value="">Proyecto</option>
            {projects.map((p) => (
              <option key={p.project_slug} value={p.project_slug}>
                {p.project_name}
              </option>
            ))}
          </select>

          {towers.length > 1 && (
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={towerId}
              onChange={(e) => {
                setTowerId(e.target.value);
                setUnitId("");
              }}
            >
              <option value="">Torre</option>
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
            value={unitId}
            onChange={(e) => {
              setUnitId(e.target.value);
              updateParam("unit", e.target.value);
            }}
          >
            <option value="">
              {unitsLoading ? "Cargando…" : "Unidad"}
            </option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_number} — {u.unit_type} — {formatCurrency(u.price_list, config.currency)}
              </option>
            ))}
          </select>
        </div>

        {preselectedUnit && !projectSlug && (
          <p className="text-xs text-muted">
            Unidad preseleccionada: <strong>{preselectedUnit.unit_number}</strong> ({preselectedUnit.project_name})
          </p>
        )}
      </section>

      {selectedUnit && price > 0 && (
        <>
          {/* Unit summary */}
          <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Unidad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Detail label="Unidad" value={selectedUnit.unit_number} />
              <Detail label="Proyecto" value={selectedUnit.project_name} />
              <Detail label="Torre" value={selectedUnit.tower_name} />
              <Detail label="Piso" value={String(selectedUnit.floor_number)} />
              <Detail label="Tipo" value={selectedUnit.unit_type} />
              <Detail label="Dormitorios" value={String(selectedUnit.bedrooms)} />
              {selectedUnit.area_total ? <Detail label="Área total" value={`${selectedUnit.area_total} m²`} /> : null}
              <Detail label="Precio lista" value={formatCurrency(price, config.currency)} />
              {selectedUnit.tower_delivery_date && (
                <Detail label="Entrega estimada" value={formatDate(selectedUnit.tower_delivery_date)} />
              )}
            </div>
          </section>

          {/* Enganche parameters */}
          <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Enganche</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="grid gap-1">
                <span className="text-xs text-muted">Enganche (%)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={Math.round(enganchePct * 100)}
                    onChange={(e) => setEnganchePctOverride(Number(e.target.value) / 100)}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-10 text-right">{Math.round(enganchePct * 100)}%</span>
                </div>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Reserva ({config.currency === "USD" ? "$" : "Q"})</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={reserva}
                  onChange={(e) => setReservaOverride(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Cuotas de enganche</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonthsOverride(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-border">
              <Detail label="Enganche total" value={formatCurrency(enganche.enganche_total, config.currency)} />
              <Detail label="Reserva" value={formatCurrency(enganche.reserva, config.currency)} />
              <Detail label="Enganche neto" value={formatCurrency(enganche.enganche_neto, config.currency)} />
              <Detail label="Cuota enganche" value={formatCurrency(enganche.cuota_enganche, config.currency)} />
            </div>

            <InstallmentTable installments={enganche.installments} />
          </section>

          {/* Financing matrix */}
          <FinancingMatrix scenarios={financing} config={config} />

          {/* Escrituracion */}
          <EscrituracionPanel
            result={escrituracion}
            config={config}
            inmueblePct={inmueblePct}
            onInmueblePctChange={setInmueblePctOverride}
          />

          {/* Mantenimiento */}
          {mantenimiento != null && (
            <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {config.mantenimiento_label ?? "Cuota de mantenimiento"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <Detail label="Área total" value={`${selectedUnit.area_total ?? 0} m²`} />
                <Detail label="Precio / m²" value={formatCurrency(config.mantenimiento_per_m2, config.currency)} />
                <Detail label="Cuota mensual" value={formatCurrency(mantenimiento, config.currency)} />
              </div>
            </section>
          )}

          {/* Disclaimers */}
          {config.disclaimers.length > 0 && (
            <section className="cotizador-disclaimers text-xs text-muted space-y-1 px-1">
              {config.disclaimers.map((d, i) => (
                <p key={i}>* {d}</p>
              ))}
            </section>
          )}

          {/* Print footer — visible only in print */}
          <div className="cotizador-print-footer" style={{ display: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 16, borderTop: "1px solid #ddd" }}>
              <div>
                {salespersonName && <div>Asesor: {salespersonName}</div>}
                <div style={{ marginTop: 32, borderTop: "1px solid #000", width: 200, paddingTop: 4 }}>Firma</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "9pt", color: "#888" }}>
                <div>Puerta Abierta Inmobiliaria</div>
                <div>Cotización válida {config.validity_days} días</div>
              </div>
            </div>
          </div>

          {/* Print button — hidden in print */}
          <div className="cotizador-no-print flex justify-center pt-2">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Imprimir cotización
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted text-xs">{label}</div>
      <div className="text-text-primary font-medium truncate">{value}</div>
    </div>
  );
}

const printStyles = `
  @media print {
    /* Hide non-printable elements */
    nav, .cotizador-no-print { display: none !important; }

    /* Show print-only elements */
    .cotizador-print-footer { display: block !important; }

    /* Page setup */
    @page {
      size: letter;
      margin: 1.5cm 2cm;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cotizador-page {
      max-width: none !important;
      padding: 0 !important;
      gap: 12px !important;
    }

    .cotizador-page * {
      color: #000 !important;
      border-color: #ccc !important;
    }

    .cotizador-page section {
      background: #fff !important;
      box-shadow: none !important;
      border: 1px solid #ddd !important;
      border-radius: 4px !important;
      padding: 8px 12px !important;
      break-inside: avoid;
    }

    .cotizador-page table {
      font-size: 9pt !important;
    }

    /* Smaller text for disclaimers in print */
    .cotizador-disclaimers {
      font-size: 8pt !important;
    }

    /* Hide interactive controls in print */
    input[type="range"],
    input[type="number"],
    input[type="text"],
    select {
      display: none !important;
    }

    /* Show values as text instead of inputs */
    label {
      display: block !important;
    }
  }
`;
