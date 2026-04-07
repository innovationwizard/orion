"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentSalesperson } from "@/hooks/use-current-salesperson";
import { useUnits } from "@/hooks/use-units";
import { useRealtimeUnits } from "@/hooks/use-realtime-units";
import { useOfflineQueue } from "./use-offline-queue";
import { UNIT_STATUS_COLORS, formatCurrency } from "@/lib/reservas/constants";
import type { UnitFull } from "@/lib/reservas/types";
import ReservationForm from "./reservation-form";

type Screen = "grid" | "form";

export default function ReservarClient() {
  const { online, queueSize, enqueue } = useOfflineQueue();
  const { data: me, loading: meLoading, error: meError } = useCurrentSalesperson();

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const [screen, setScreen] = useState<Screen>("grid");
  const [selectedUnit, setSelectedUnit] = useState<UnitFull | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Project selection (for multi-project salespeople)
  const projects = me?.projects ?? [];
  const [projectSlug, setProjectSlug] = useState("");

  // Set default project when loaded
  useEffect(() => {
    if (projects.length > 0 && !projectSlug) {
      setProjectSlug(projects[0].slug);
    }
  }, [projects, projectSlug]);

  // Tower filter
  const currentProject = projects.find((p) => p.slug === projectSlug);
  const towers = currentProject?.towers ?? [];
  const [towerId, setTowerId] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Fetch units for selected project/tower
  const { data: units, setData: setUnits, loading: unitsLoading } = useUnits({
    project: projectSlug || undefined,
    tower: towerId || undefined,
    status: "AVAILABLE",
  });

  // Realtime updates
  useRealtimeUnits(units, setUnits);

  // Filter by search
  const filteredUnits = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.toLowerCase().trim();
    return units.filter((u) => u.unit_number.toLowerCase().includes(q));
  }, [units, search]);

  const handleSelectUnit = useCallback((unit: UnitFull) => {
    setSelectedUnit(unit);
    setScreen("form");
  }, []);

  const handleBack = useCallback(() => {
    setScreen("grid");
    setSelectedUnit(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setSubmitted(true);
    setScreen("grid");
    setSelectedUnit(null);
  }, []);

  const handleReset = useCallback(() => {
    setSubmitted(false);
  }, []);

  // Loading state
  if (meLoading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-6">
        <div className="grid gap-4">
          <div className="h-8 w-48 rounded-lg bg-border animate-pulse" />
          <div className="h-10 rounded-lg bg-border animate-pulse" />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (meError || !me) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-6">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center grid gap-4">
          <div className="text-4xl">!</div>
          <h2 className="text-lg font-bold text-text-primary">No se pudo cargar tu perfil</h2>
          <p className="text-sm text-muted">
            {meError ?? "Tu cuenta no está vinculada a un asesor. Contacta al administrador."}
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-6">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center grid gap-4">
          <div className="text-5xl">&#10003;</div>
          <h2 className="text-xl font-bold text-text-primary">Reserva enviada</h2>
          <p className="text-sm text-muted">
            La reserva fue registrada exitosamente y está pendiente de revisión por el administrador.
          </p>
          <button
            type="button"
            className="mx-auto px-6 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
            onClick={handleReset}
          >
            Reservar otra unidad
          </button>
        </div>
      </div>
    );
  }

  // Form screen
  if (screen === "form" && selectedUnit) {
    return (
      <ReservationForm
        unit={selectedUnit}
        salesperson={me.salesperson}
        enqueue={enqueue}
        online={online}
        queueSize={queueSize}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  // Grid screen (default)
  return (
    <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Reservar</h1>
          <p className="text-xs text-muted">{me.salesperson.display_name}</p>
        </div>
        {!online && (
          <div className="px-3 py-1.5 rounded-lg bg-warning/15 text-warning text-xs font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />
            Sin conexión{queueSize > 0 ? ` · ${queueSize}` : ""}
          </div>
        )}
      </div>

      {/* Project chips (only if multi-project) */}
      {projects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {projects.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                projectSlug === p.slug
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-text-primary hover:bg-primary/5"
              }`}
              onClick={() => {
                setProjectSlug(p.slug);
                setTowerId("");
                setSearch("");
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Tower chips */}
      {towers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !towerId
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border text-muted hover:text-text-primary"
            }`}
            onClick={() => setTowerId("")}
          >
            Todas
          </button>
          {towers.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                towerId === t.id
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted hover:text-text-primary"
              }`}
              onClick={() => setTowerId(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por número de unidad..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Units grid */}
      {unitsLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-border animate-pulse" />
          ))}
        </div>
      ) : filteredUnits.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">
          {search
            ? "No se encontraron unidades con ese número."
            : "No hay unidades disponibles con estos filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {filteredUnits.map((u) => (
            <button
              key={u.id}
              type="button"
              className="min-h-[48px] rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{ backgroundColor: UNIT_STATUS_COLORS[u.status] }}
              title={`${u.unit_number} — ${u.unit_type} — ${formatCurrency(u.price_list, u.currency)}`}
              onClick={() => handleSelectUnit(u)}
            >
              <span className="block leading-tight">{u.unit_number}</span>
              {u.area_total ? (
                <span className="block text-[10px] font-normal opacity-80">{u.area_total}m²</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted text-center">
        {filteredUnits.length} unidad{filteredUnits.length !== 1 ? "es" : ""} disponible{filteredUnits.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
