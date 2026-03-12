"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useUnits } from "@/hooks/use-units";
import type { UnitFull } from "@/lib/reservas/types";
import {
  COTIZADOR_DEFAULTS,
  computeEnganche,
  computeFinancingMatrix,
  computeEscrituracion,
} from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";
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

  // If preselected unit, detect its project/tower
  const preselectedUnit = useMemo(
    () => (preselectedUnitId ? units.find((u) => u.id === preselectedUnitId) : undefined),
    [units, preselectedUnitId],
  );

  const selectedUnit: UnitFull | null = useMemo(
    () => units.find((u) => u.id === unitId) ?? null,
    [units, unitId],
  );

  // Parameters (user-adjustable)
  const [enganchePct, setEnganchePct] = useState<number>(COTIZADOR_DEFAULTS.ENGANCHE_PCT);
  const [reserva, setReserva] = useState<number>(COTIZADOR_DEFAULTS.RESERVA_AMOUNT);
  const [installmentMonths, setInstallmentMonths] = useState<number>(COTIZADOR_DEFAULTS.INSTALLMENT_MONTHS);
  const [inmueblePct, setInmueblePct] = useState<number>(COTIZADOR_DEFAULTS.INMUEBLE_PCT);

  // Computations
  const price = selectedUnit?.price_list ?? 0;

  const enganche = useMemo(
    () => computeEnganche(price, enganchePct, reserva, installmentMonths),
    [price, enganchePct, reserva, installmentMonths],
  );

  const financing = useMemo(
    () => computeFinancingMatrix(price, enganche.enganche_total),
    [price, enganche.enganche_total],
  );

  const escrituracion = useMemo(
    () => computeEscrituracion(price, inmueblePct),
    [price, inmueblePct],
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

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[900px] mx-auto">
      <NavBar />

      <header>
        <h1 className="text-2xl font-bold text-text-primary">Cotizador</h1>
        <p className="text-sm text-muted mt-1">Calcula enganche, financiamiento y escrituracion</p>
      </header>

      {/* Unit selector */}
      <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Seleccionar unidad</h2>
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={projectSlug}
            onChange={(e) => {
              setProjectSlug(e.target.value);
              setTowerId("");
              setUnitId("");
              updateParam("unit", "");
            }}
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
                {u.unit_number} — {u.unit_type} — {formatCurrency(u.price_list)}
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
              {selectedUnit.area_total ? <Detail label="Area total" value={`${selectedUnit.area_total} m²`} /> : null}
              <Detail label="Precio lista" value={formatCurrency(price)} />
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
                    onChange={(e) => setEnganchePct(Number(e.target.value) / 100)}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-10 text-right">{Math.round(enganchePct * 100)}%</span>
                </div>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Reserva (Q)</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={reserva}
                  onChange={(e) => setReserva(Number(e.target.value))}
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
                  onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-border">
              <Detail label="Enganche total" value={formatCurrency(enganche.enganche_total)} />
              <Detail label="Reserva" value={formatCurrency(enganche.reserva)} />
              <Detail label="Enganche neto" value={formatCurrency(enganche.enganche_neto)} />
              <Detail label="Cuota enganche" value={formatCurrency(enganche.cuota_enganche)} />
            </div>

            <InstallmentTable installments={enganche.installments} />
          </section>

          {/* Financing matrix */}
          <FinancingMatrix scenarios={financing} />

          {/* Escrituracion */}
          <EscrituracionPanel
            result={escrituracion}
            inmueblePct={inmueblePct}
            onInmueblePctChange={setInmueblePct}
          />
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
