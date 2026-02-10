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
  onChange: (next: { project_id?: string; start_date?: string; end_date?: string }) => void;
};

export default function Filters({
  projects,
  projectId,
  startDate,
  endDate,
  onChange
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
    <div className="filters-bar">
      <div className="filters-bar__presets">
        <span className="filters-bar__presets-label">Rango:</span>
        <div className="filters-bar__presets-buttons">
          {(Object.keys(DATE_PRESETS) as PresetKey[]).map((key) => {
            const preset = DATE_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                className={`button small ${isActive ? "active" : "secondary"}`}
                onClick={() => applyPreset(key)}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filters-bar__custom">
        <label className="filters-bar__label">
          <span className="filters-bar__label-text">Desde</span>
          <input
            className="date-input"
            type="date"
            value={startDate}
            onChange={(e) => onChange({ start_date: e.target.value })}
            aria-label="Fecha inicio"
          />
        </label>
        <label className="filters-bar__label">
          <span className="filters-bar__label-text">Hasta</span>
          <input
            className="date-input"
            type="date"
            value={endDate}
            onChange={(e) => onChange({ end_date: e.target.value })}
            aria-label="Fecha fin"
          />
        </label>
      </div>

      <div className="filters-bar__project">
        <label className="filters-bar__label">
          <span className="filters-bar__label-text">Proyecto</span>
          <select
            className="select"
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

      <div className="filters-bar__meta">
        {activeCount > 0 ? (
          <>
            <span className="filters-bar__range" title="Rango y filtros aplicados">
              {hasDateFilter ? rangeLabel : "—"}
              {hasProjectFilter && (
                <span className="filters-bar__chip">
                  {projects.find((p) => p.id === projectId)?.name ?? "Proyecto"}
                </span>
              )}
            </span>
            <button
              type="button"
              className="button small secondary filters-bar__clear"
              onClick={clearAll}
              aria-label="Quitar todos los filtros"
            >
              Limpiar filtros
            </button>
          </>
        ) : (
          <span className="filters-bar__range muted">Sin filtros · datos completos</span>
        )}
      </div>
    </div>
  );
}
