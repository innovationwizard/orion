"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useVentasContext } from "@/lib/reservas/ventas-context";
import { useUnits } from "@/hooks/use-units";
import { useRealtimeUnits } from "@/hooks/use-realtime-units";
import type { UnitFull, RvUnitStatus } from "@/lib/reservas/types";
import {
  UNIT_STATUS_LABELS,
  UNIT_STATUS_COLORS,
  UNIT_STATUSES,
  formatCurrency,
} from "@/lib/reservas/constants";
import UnitDetailModal from "./unit-detail-modal";

function getInitialParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

export default function InventarioClient() {
  const { projects } = useVentasContext();

  const [projectSlug, setProjectSlug] = useState(() =>
    getInitialParam("project"),
  );
  const [towerId, setTowerId] = useState(() => getInitialParam("tower"));
  const [statusFilter, setStatusFilter] = useState<RvUnitStatus | "">("");
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<UnitFull | null>(null);

  // Sync local state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (projectSlug) params.set("project", projectSlug);
    if (towerId) params.set("tower", towerId);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [projectSlug, towerId, statusFilter]);

  const {
    data: units,
    setData: setUnits,
    loading: unitsLoading,
  } = useUnits({
    project: projectSlug || undefined,
    tower: towerId || undefined,
    status: statusFilter || undefined,
  });
  const { connectionState } = useRealtimeUnits(units, setUnits);

  const updateProject = useCallback((v: string) => {
    setProjectSlug(v);
    setTowerId("");
  }, []);

  // Get towers for selected project
  const towers = useMemo(() => {
    if (!projectSlug) return [];
    const project = projects.find((p) => p.slug === projectSlug);
    return project?.towers ?? [];
  }, [projects, projectSlug]);

  // Filter units by search text
  const filtered = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.trim().toLowerCase();
    return units.filter(
      (u) =>
        u.unit_number.toLowerCase().includes(q) ||
        u.unit_type.toLowerCase().includes(q) ||
        u.project_name.toLowerCase().includes(q) ||
        u.tower_name.toLowerCase().includes(q),
    );
  }, [units, search]);

  // Group filtered units by tower
  const towerGroups = useMemo(() => {
    const map = new Map<string, { name: string; units: UnitFull[] }>();
    for (const u of filtered) {
      const key = u.tower_id;
      const group = map.get(key) ?? {
        name: `${u.project_name} — ${u.tower_name}`,
        units: [],
      };
      group.units.push(u);
      map.set(key, group);
    }
    return [...map.values()];
  }, [filtered]);

  // Summary counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of units) {
      c[u.status] = (c[u.status] ?? 0) + 1;
    }
    return c;
  }, [units]);

  return (
    <div className="grid gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={projectSlug}
          onChange={(e) => updateProject(e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        {towers.length > 1 && (
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={towerId}
            onChange={(e) => setTowerId(e.target.value)}
          >
            <option value="">Todas las torres</option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as RvUnitStatus | "")
          }
        >
          <option value="">Todos los estados</option>
          {(Object.entries(UNIT_STATUS_LABELS) as [RvUnitStatus, string][]).map(
            ([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ),
          )}
        </select>

        <input
          type="search"
          placeholder="Buscar unidad..."
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Connection indicator */}
        <span
          className={`ml-auto inline-flex items-center gap-1.5 text-xs ${
            connectionState === "connected"
              ? "text-success"
              : connectionState === "disconnected"
                ? "text-danger"
                : "text-warning"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === "connected"
                ? "bg-success"
                : connectionState === "disconnected"
                  ? "bg-danger"
                  : "bg-warning"
            }`}
          />
          {connectionState === "connected" ? "En vivo" : "Reconectando..."}
        </span>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {UNIT_STATUSES.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary"
          >
            <span
              className="w-2.5 h-2.5 rounded"
              style={{ backgroundColor: UNIT_STATUS_COLORS[status] }}
            />
            {UNIT_STATUS_LABELS[status]}:{" "}
            <strong className="tabular-nums">{counts[status] ?? 0}</strong>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary">
          Total: <strong className="tabular-nums">{units.length}</strong>
        </span>
      </div>

      {/* Grid */}
      {unitsLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-6 animate-pulse"
            >
              <div className="h-4 w-40 rounded bg-border mb-4" />
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 18 }).map((_, j) => (
                  <div key={j} className="h-11 rounded-lg bg-border" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : towerGroups.length === 0 ? (
        <div className="py-12 text-center text-muted">
          No se encontraron unidades con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid gap-4">
          {towerGroups.map((g) => (
            <TowerGrid
              key={g.name}
              towerName={g.name}
              units={g.units}
              onUnitClick={setSelectedUnit}
            />
          ))}
        </div>
      )}

      {/* Unit detail modal */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}

/* ---------- Tower grid (adapted from AvailabilityGrid) ---------- */

function TowerGrid({
  towerName,
  units,
  onUnitClick,
}: {
  towerName: string;
  units: UnitFull[];
  onUnitClick: (u: UnitFull) => void;
}) {
  const floorMap = new Map<number, UnitFull[]>();
  for (const u of units) {
    const list = floorMap.get(u.floor_number) ?? [];
    list.push(u);
    floorMap.set(u.floor_number, list);
  }

  const floors = [...floorMap.entries()].sort((a, b) => b[0] - a[0]);
  for (const [, floorUnits] of floors) {
    floorUnits.sort((a, b) =>
      a.unit_number.localeCompare(b.unit_number, "es", { numeric: true }),
    );
  }

  if (floors.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-4 grid gap-3">
      <h3 className="text-sm font-semibold text-text-primary">{towerName}</h3>
      <div className="overflow-x-auto">
        <div className="grid gap-1.5 min-w-fit">
          {floors.map(([floorNum, floorUnits]) => (
            <div key={floorNum} className="flex items-center gap-1.5">
              <span className="shrink-0 w-10 text-right text-xs text-muted font-medium tabular-nums">
                P{floorNum}
              </span>
              <div className="flex gap-1.5">
                {floorUnits.map((u) => {
                  const bg = UNIT_STATUS_COLORS[u.status];
                  const isSold = u.status === "SOLD";
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="relative min-w-[56px] min-h-[44px] rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      style={{
                        backgroundColor: bg,
                        opacity: isSold ? 0.6 : 1,
                      }}
                      title={`${u.unit_number} — ${UNIT_STATUS_LABELS[u.status]}`}
                      onClick={() => onUnitClick(u)}
                    >
                      <span className="block leading-tight">
                        {u.unit_number}
                      </span>
                      {u.area_total ? (
                        <span className="block text-[10px] font-normal opacity-80">
                          {u.area_total}m²
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
