"use client";

import {
  DATE_PRESETS,
  formatDateRangeLabel,
  getPresetKeyForRange,
  type PresetKey
} from "@/lib/date-presets";

type FiltersProps = {
  projects: { id: string; name: string }[];
  projectId: string;
  startDate: string;
  endDate: string;
  excludeFF: boolean;
  onChange: (next: { project_id?: string; start_date?: string; end_date?: string }) => void;
  onToggleFF: () => void;
};

export default function Filters({
  projects,
  projectId,
  startDate,
  endDate,
  excludeFF,
  onChange,
  onToggleFF
}: FiltersProps) {
  const activePreset = getPresetKeyForRange(startDate, endDate);
  const rangeLabel =
    startDate && endDate ? formatDateRangeLabel(startDate, endDate) : "Sin rango";
  const hasProjectFilter = Boolean(projectId);
  const hasDateFilter = Boolean(startDate && endDate);
  const activeCount = (hasProjectFilter ? 1 : 0) + (hasDateFilter ? 1 : 0);

  function applyPreset(key: PresetKey) {
    const { getRange } = DATE_PRESETS[key];
    const { start, end } = getRange();
    onChange({ start_date: start, end_date: end });
  }

  function clearAll() {
    onChange({
      project_id: "",
      start_date: "",
      end_date: ""
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 gap-x-5">
      <div className="flex flex-wrap items-center gap-2 gap-x-2.5">
        <span className="text-[13px] font-semibold text-muted">Rango:</span>
        <div className="flex flex-wrap gap-1.5 gap-x-2">
          {(Object.keys(DATE_PRESETS) as PresetKey[]).map((key) => {
            const preset = DATE_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                className={
                  isActive
                    ? "border-none bg-primary-hover text-white px-3 py-1.5 rounded-full font-semibold cursor-pointer text-[13px] transition-colors duration-200"
                    : "bg-transparent border border-border text-text-primary px-3 py-1.5 rounded-full font-semibold cursor-pointer text-[13px] transition-colors duration-200 hover:bg-primary/8 hover:border-primary hover:text-primary"
                }
                onClick={() => applyPreset(key)}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 gap-x-3">
        <label className="inline-flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">Desde</span>
          <input
            className="w-full min-w-[140px] px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            type="date"
            value={startDate}
            onChange={(e) => onChange({ start_date: e.target.value })}
            aria-label="Fecha inicio"
          />
        </label>
        <label className="inline-flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">Hasta</span>
          <input
            className="w-full min-w-[140px] px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            type="date"
            value={endDate}
            onChange={(e) => onChange({ end_date: e.target.value })}
            aria-label="Fecha fin"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 gap-x-3">
        <label className="inline-flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">Proyecto</span>
          <select
            className="w-full min-w-[140px] px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            value={projectId}
            onChange={(e) => onChange({ project_id: e.target.value })}
            aria-label="Filtrar por proyecto"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        className={
          excludeFF
            ? "border-none bg-primary-hover text-white px-3 py-1.5 rounded-full font-semibold cursor-pointer text-[13px] transition-colors duration-200"
            : "bg-transparent border border-border text-text-primary px-3 py-1.5 rounded-full font-semibold cursor-pointer text-[13px] transition-colors duration-200 hover:bg-primary/8 hover:border-primary hover:text-primary"
        }
        onClick={onToggleFF}
        aria-pressed={excludeFF}
        title="Excluir ventas de casos especiales (F&F)"
      >
        {excludeFF ? "F&F excluido" : "Incluye F&F"}
      </button>

      <div className="flex flex-wrap items-center gap-2.5 gap-x-3.5 ml-auto">
        {activeCount > 0 ? (
          <>
            <span className="text-xs font-medium text-text-primary" title="Rango y filtros aplicados">
              {hasDateFilter ? rangeLabel : "—"}
              {hasProjectFilter && (
                <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[11px] font-semibold">
                  {projects.find((p) => p.id === projectId)?.name ?? "Proyecto"}
                </span>
              )}
            </span>
            <button
              type="button"
              className="shrink-0 bg-transparent border border-border text-text-primary px-3 py-1.5 rounded-full font-semibold cursor-pointer text-[13px] transition-colors duration-200 hover:bg-primary/8 hover:border-primary hover:text-primary"
              onClick={clearAll}
              aria-label="Quitar todos los filtros"
            >
              Limpiar filtros
            </button>
          </>
        ) : (
          <span className="text-xs font-medium text-muted">Sin filtros · datos completos</span>
        )}
      </div>
    </div>
  );
}
