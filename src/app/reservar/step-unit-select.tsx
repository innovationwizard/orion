"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useUnits } from "@/hooks/use-units";
import { useSalespeople } from "@/hooks/use-salespeople";
import { UNIT_STATUS_COLORS, UNIT_STATUS_LABELS, formatCurrency } from "@/lib/reservas/constants";
import type { UnitFull } from "@/lib/reservas/types";

type Props = {
  initialUnitId?: string;
  onNext: (unitId: string, salespersonId: string) => void;
};

export default function StepUnitSelect({ initialUnitId, onNext }: Props) {
  const { data: projects } = useProjects();
  const { data: salespeople } = useSalespeople();

  const [projectSlug, setProjectSlug] = useState("");
  const [towerId, setTowerId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnitId ?? "");
  const [salespersonId, setSalespersonId] = useState("");

  const { data: units, loading } = useUnits({
    project: projectSlug || undefined,
    tower: towerId || undefined,
    status: "AVAILABLE",
  });

  const currentProject = projects.find((p) => p.project_slug === projectSlug);
  const towers = currentProject?.towers ?? [];

  const unitObj = useMemo(
    () => units.find((u) => u.id === selectedUnit),
    [units, selectedUnit],
  );

  const canContinue = !!selectedUnit && !!salespersonId;

  return (
    <div className="grid gap-5">
      <h2 className="text-lg font-bold text-text-primary">Seleccionar unidad</h2>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-3">
        <select
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={projectSlug}
          onChange={(e) => {
            setProjectSlug(e.target.value);
            setTowerId("");
            setSelectedUnit("");
          }}
        >
          <option value="">Seleccionar proyecto</option>
          {projects.map((p) => (
            <option key={p.project_slug} value={p.project_slug}>
              {p.project_name}
            </option>
          ))}
        </select>

        {towers.length > 1 && (
          <select
            className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={towerId}
            onChange={(e) => {
              setTowerId(e.target.value);
              setSelectedUnit("");
            }}
          >
            <option value="">Todas las torres</option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Units grid */}
      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-border animate-pulse" />
          ))}
        </div>
      ) : units.length === 0 ? (
        <p className="text-sm text-muted py-4">
          {projectSlug
            ? "No hay unidades disponibles con estos filtros."
            : "Selecciona un proyecto para ver unidades disponibles."}
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {units.map((u) => (
            <UnitButton
              key={u.id}
              unit={u}
              selected={u.id === selectedUnit}
              onSelect={() => setSelectedUnit(u.id)}
            />
          ))}
        </div>
      )}

      {/* Selected unit detail */}
      {unitObj && (
        <div className="bg-card rounded-xl border border-border p-4 text-sm grid grid-cols-2 gap-2">
          <span className="text-muted">Unidad</span>
          <span className="font-medium">{unitObj.unit_number}</span>
          <span className="text-muted">Tipo</span>
          <span className="font-medium">{unitObj.unit_type} · {unitObj.bedrooms} dorm.</span>
          {unitObj.area_total ? (
            <>
              <span className="text-muted">Área</span>
              <span className="font-medium">{unitObj.area_total} m²</span>
            </>
          ) : null}
          <span className="text-muted">Precio</span>
          <span className="font-medium">{formatCurrency(unitObj.price_list)}</span>
        </div>
      )}

      {/* Salesperson */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-text-primary">Asesor de venta</label>
        <select
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={salespersonId}
          onChange={(e) => setSalespersonId(e.target.value)}
        >
          <option value="">Seleccionar asesor</option>
          {salespeople.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Next */}
      <button
        type="button"
        disabled={!canContinue}
        className="w-full py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => onNext(selectedUnit, salespersonId)}
      >
        Siguiente
      </button>
    </div>
  );
}

function UnitButton({
  unit,
  selected,
  onSelect,
}: {
  unit: UnitFull;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-[48px] rounded-lg text-xs font-semibold text-white transition-all duration-150 ${
        selected ? "ring-2 ring-primary ring-offset-2 scale-105" : "hover:brightness-110"
      }`}
      style={{ backgroundColor: UNIT_STATUS_COLORS[unit.status] }}
      title={`${unit.unit_number} — ${UNIT_STATUS_LABELS[unit.status]} — ${formatCurrency(unit.price_list)}`}
      onClick={onSelect}
    >
      <span className="block leading-tight">{unit.unit_number}</span>
      {unit.area_total ? (
        <span className="block text-[10px] font-normal opacity-80">{unit.area_total}m²</span>
      ) : null}
    </button>
  );
}
