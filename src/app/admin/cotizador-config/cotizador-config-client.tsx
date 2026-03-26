"use client";

import { useCallback, useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";

interface ConfigRow {
  id: string;
  project_id: string;
  tower_id: string | null;
  unit_type: string | null;
  label: string;
  currency: "GTQ" | "USD";
  enganche_pct: number;
  reserva_default: number;
  installment_months: number;
  round_enganche_q100: boolean;
  round_cuota_q100: boolean;
  round_cuota_q1: boolean;
  round_saldo_q100: boolean;
  bank_rates: number[];
  bank_rate_labels: string[] | null;
  plazos_years: number[];
  include_seguro_in_cuota: boolean;
  include_iusi_in_cuota: boolean;
  seguro_enabled: boolean;
  seguro_base: string;
  iusi_frequency: string;
  income_multiplier: number;
  income_base: string;
  inmueble_pct: number;
  timbres_rate: number;
  use_pretax_extraction: boolean;
  mantenimiento_per_m2: number | null;
  mantenimiento_label: string | null;
  disclaimers: string[] | null;
  validity_days: number;
  is_active: boolean;
  display_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: { name: string; slug: string } | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  towers: { name: string } | any;
}

export default function CotizadorConfigClient() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cotizador-config");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      setConfigs(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleActive(id: string, currentActive: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/admin/cotizador-config/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      await fetchData();
    } catch {
      setError("Error al cambiar estado");
    } finally {
      setToggling(null);
    }
  }

  // Group configs by project
  const grouped = configs.reduce<Record<string, ConfigRow[]>>((acc, c) => {
    const key = c.projects?.name ?? c.project_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1100px] mx-auto">
      <NavBar />

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuración Cotizador</h1>
          <p className="text-sm text-muted mt-1">Parámetros por proyecto/torre/tipo de unidad</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-muted py-12">Cargando configuraciones...</div>
      ) : configs.length === 0 ? (
        <div className="text-center text-muted py-12">No hay configuraciones.</div>
      ) : (
        Object.entries(grouped).map(([projectName, projectConfigs]) => (
          <section key={projectName} className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{projectName}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Variante</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Torre</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Tipo</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Enganche</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Reserva</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Cuotas</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Tasas</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {projectConfigs.map((c) => (
                    <>
                      <tr
                        key={c.id}
                        className="border-b border-border/50 cursor-pointer hover:bg-white/5"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      >
                        <td className="py-2 px-3 font-medium">{c.label}</td>
                        <td className="py-2 px-3">{c.towers?.name ?? "—"}</td>
                        <td className="py-2 px-3">{c.unit_type ?? "Todos"}</td>
                        <td className="py-2 px-3 text-center">{(Number(c.enganche_pct) * 100).toFixed(0)}%</td>
                        <td className="py-2 px-3 text-center">{c.currency === "USD" ? "$" : "Q"}{Number(c.reserva_default).toLocaleString()}</td>
                        <td className="py-2 px-3 text-center">{c.installment_months}</td>
                        <td className="py-2 px-3 text-center">{c.bank_rates.map((r) => `${(Number(r) * 100).toFixed(2)}%`).join(", ")}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(c.id, c.is_active);
                            }}
                            disabled={toggling === c.id}
                            className={`w-8 h-5 rounded-full relative transition-colors ${c.is_active ? "bg-green-500" : "bg-gray-500"}`}
                          >
                            <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${c.is_active ? "translate-x-3.5" : "translate-x-0.5"}`} />
                          </button>
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr key={`${c.id}-detail`} className="border-b border-border/50 bg-white/[0.02]">
                          <td colSpan={8} className="px-5 py-4">
                            <ConfigDetail config={c} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ConfigDetail({ config: c }: { config: ConfigRow }) {
  const rounding = [
    c.round_enganche_q100 && "Enganche→Q100",
    c.round_cuota_q100 && "Cuota→Q100",
    c.round_cuota_q1 && "Cuota→Q1",
    c.round_saldo_q100 && "Saldo→Q100",
  ].filter(Boolean);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
      <div>
        <span className="text-muted text-xs block">Moneda</span>
        <span className="text-text-primary">{c.currency}</span>
      </div>
      <div>
        <span className="text-muted text-xs block">Redondeo</span>
        <span className="text-text-primary">{rounding.length > 0 ? rounding.join(", ") : "Ninguno"}</span>
      </div>
      <div>
        <span className="text-muted text-xs block">Plazos (años)</span>
        <span className="text-text-primary">{c.plazos_years.join(", ")}</span>
      </div>
      <div>
        <span className="text-muted text-xs block">Labels de tasas</span>
        <span className="text-text-primary">{c.bank_rate_labels?.join(", ") ?? "—"}</span>
      </div>
      <div>
        <span className="text-muted text-xs block">Seguro</span>
        <span className="text-text-primary">
          {c.seguro_enabled ? `Sí (base: ${c.seguro_base}${c.include_seguro_in_cuota ? ", en cuota" : ", informativo"})` : "No"}
        </span>
      </div>
      <div>
        <span className="text-muted text-xs block">IUSI</span>
        <span className="text-text-primary">
          {c.include_iusi_in_cuota ? "En cuota mensual" : "Aparte"} ({c.iusi_frequency})
        </span>
      </div>
      <div>
        <span className="text-muted text-xs block">Ingreso requerido</span>
        <span className="text-text-primary">{Number(c.income_multiplier)}x {c.income_base === "cuota_banco" ? "cuota banco" : "cuota mensual"}</span>
      </div>
      <div>
        <span className="text-muted text-xs block">Escrituración</span>
        <span className="text-text-primary">
          {(Number(c.inmueble_pct) * 100).toFixed(0)}/{(100 - Number(c.inmueble_pct) * 100).toFixed(0)}
          {c.timbres_rate > 0 ? ` (timbres ${(Number(c.timbres_rate) * 100).toFixed(0)}%)` : ""}
          {c.use_pretax_extraction ? " ÷factor" : ""}
        </span>
      </div>
      <div>
        <span className="text-muted text-xs block">Mantenimiento</span>
        <span className="text-text-primary">
          {c.mantenimiento_per_m2 != null ? `${c.currency === "USD" ? "$" : "Q"}${c.mantenimiento_per_m2}/m²` : c.mantenimiento_label ?? "—"}
        </span>
      </div>
      <div>
        <span className="text-muted text-xs block">Validez</span>
        <span className="text-text-primary">{c.validity_days} días</span>
      </div>
      {c.disclaimers && c.disclaimers.length > 0 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="text-muted text-xs block">Disclaimers</span>
          <ul className="text-text-primary list-disc pl-4 space-y-0.5">
            {c.disclaimers.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
