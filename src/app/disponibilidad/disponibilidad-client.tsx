"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useUnits } from "@/hooks/use-units";
import { useRealtimeUnits } from "@/hooks/use-realtime-units";
import type { UnitFull } from "@/lib/reservas/types";
import { UNIT_STATUS_LABELS } from "@/lib/reservas/constants";
import type { RvUnitStatus } from "@/lib/reservas/types";
import ProjectTowerFilter from "./project-tower-filter";
import StatusLegend from "./status-legend";
import ConnectionStatus from "./connection-status";
import AvailabilityGrid from "./availability-grid";
import NavBar from "@/components/nav-bar";

function getInitialParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

export default function DisponibilidadClient() {
  const [projectSlug, setProjectSlug] = useState(() => getInitialParam("project"));
  const [towerId, setTowerId] = useState(() => getInitialParam("tower"));
  const [statusFilter, setStatusFilter] = useState<RvUnitStatus | "">(
    () => getInitialParam("status") as RvUnitStatus | "",
  );

  // Sync local state → URL (without triggering Next.js navigation)
  useEffect(() => {
    const params = new URLSearchParams();
    if (projectSlug) params.set("project", projectSlug);
    if (towerId) params.set("tower", towerId);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [projectSlug, towerId, statusFilter]);

  const { data: projects, loading: projectsLoading } = useProjects();
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

  const [search, setSearch] = useState("");

  const updateProject = useCallback((v: string) => {
    setProjectSlug(v);
    setTowerId("");
  }, []);
  const updateTower = useCallback((v: string) => setTowerId(v), []);
  const updateStatus = useCallback((v: string) => setStatusFilter(v as RvUnitStatus | ""), []);

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
      const group = map.get(key) ?? { name: `${u.project_name} — ${u.tower_name}`, units: [] };
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

  const loading = projectsLoading || unitsLoading;

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Disponibilidad</h1>
          <p className="text-sm text-muted mt-1">Estado de unidades en tiempo real</p>
        </div>
        <ConnectionStatus state={connectionState} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <ProjectTowerFilter
          projects={projects}
          selectedProject={projectSlug}
          selectedTower={towerId}
          onProjectChange={updateProject}
          onTowerChange={updateTower}
        />

        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={statusFilter}
          onChange={(e) => updateStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {(Object.entries(UNIT_STATUS_LABELS) as [RvUnitStatus, string][]).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Buscar unidad..."
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(UNIT_STATUS_LABELS) as [RvUnitStatus, string][]).map(([status, label]) => (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary"
          >
            {label}: <strong className="tabular-nums">{counts[status] ?? 0}</strong>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-text-primary">
          Total: <strong className="tabular-nums">{units.length}</strong>
        </span>
      </div>

      {/* Legend */}
      <StatusLegend />

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
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
            <AvailabilityGrid key={g.name} towerName={g.name} units={g.units} />
          ))}
        </div>
      )}
    </div>
  );
}
