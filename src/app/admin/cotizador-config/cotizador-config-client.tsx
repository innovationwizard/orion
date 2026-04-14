"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "@/components/nav-bar";

/* ───── types ───── */

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
  min_enganche_pct: number | null;
  display_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: { name: string; slug: string } | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  towers: { name: string } | any;
}

interface ProjectOption {
  project_id: string;
  project_name: string;
  project_slug: string;
  towers: { id: string; name: string; is_default: boolean }[];
}

interface FormData {
  project_id: string;
  tower_id: string | null;
  unit_type: string | null;
  label: string;
  currency: "GTQ" | "USD";
  enganche_pct: string; // % display (e.g. "7")
  min_enganche_pct: string; // % display (e.g. "30"), empty = no minimum
  reserva_default: string;
  installment_months: string;
  round_enganche_q100: boolean;
  round_cuota_q100: boolean;
  round_cuota_q1: boolean;
  round_saldo_q100: boolean;
  bank_rates: string[]; // % display (e.g. ["5.50", "7.26"])
  bank_rate_labels: string[];
  plazos_years: string[]; // e.g. ["15", "20", "25"]
  include_seguro_in_cuota: boolean;
  include_iusi_in_cuota: boolean;
  seguro_enabled: boolean;
  seguro_base: "price" | "monto_financiar";
  iusi_frequency: "monthly" | "quarterly";
  income_multiplier: string;
  income_base: "cuota_banco" | "cuota_mensual";
  inmueble_pct: string; // % display (e.g. "70")
  timbres_rate: string; // % display (e.g. "3")
  use_pretax_extraction: boolean;
  mantenimiento_per_m2: string;
  mantenimiento_label: string;
  disclaimers: string[];
  validity_days: string;
  display_order: string;
}

type Msg = { type: "ok" | "err"; text: string } | null;

/* ───── helpers ───── */

function emptyForm(): FormData {
  return {
    project_id: "",
    tower_id: null,
    unit_type: null,
    label: "",
    currency: "GTQ",
    enganche_pct: "7",
    min_enganche_pct: "",
    reserva_default: "1500",
    installment_months: "7",
    round_enganche_q100: false,
    round_cuota_q100: false,
    round_cuota_q1: false,
    round_saldo_q100: false,
    bank_rates: ["5.50"],
    bank_rate_labels: [""],
    plazos_years: ["20"],
    include_seguro_in_cuota: false,
    include_iusi_in_cuota: true,
    seguro_enabled: false,
    seguro_base: "price",
    iusi_frequency: "monthly",
    income_multiplier: "2.50",
    income_base: "cuota_banco",
    inmueble_pct: "70",
    timbres_rate: "3",
    use_pretax_extraction: true,
    mantenimiento_per_m2: "",
    mantenimiento_label: "",
    disclaimers: [],
    validity_days: "7",
    display_order: "0",
  };
}

function configToForm(c: ConfigRow): FormData {
  const rates = c.bank_rates.map((r) => (Number(r) * 100).toFixed(2));
  const labels = c.bank_rate_labels ?? rates.map(() => "");
  // Pad labels to match rates length
  while (labels.length < rates.length) labels.push("");
  return {
    project_id: c.project_id,
    tower_id: c.tower_id,
    unit_type: c.unit_type,
    label: c.label,
    currency: c.currency,
    enganche_pct: (Number(c.enganche_pct) * 100).toFixed(2).replace(/\.?0+$/, ""),
    min_enganche_pct: c.min_enganche_pct != null ? (Number(c.min_enganche_pct) * 100).toFixed(2).replace(/\.?0+$/, "") : "",
    reserva_default: String(c.reserva_default),
    installment_months: String(c.installment_months),
    round_enganche_q100: c.round_enganche_q100,
    round_cuota_q100: c.round_cuota_q100,
    round_cuota_q1: c.round_cuota_q1,
    round_saldo_q100: c.round_saldo_q100,
    bank_rates: rates,
    bank_rate_labels: labels,
    plazos_years: c.plazos_years.map(String),
    include_seguro_in_cuota: c.include_seguro_in_cuota,
    include_iusi_in_cuota: c.include_iusi_in_cuota,
    seguro_enabled: c.seguro_enabled,
    seguro_base: c.seguro_base as "price" | "monto_financiar",
    iusi_frequency: c.iusi_frequency as "monthly" | "quarterly",
    income_multiplier: String(c.income_multiplier),
    income_base: c.income_base as "cuota_banco" | "cuota_mensual",
    inmueble_pct: (Number(c.inmueble_pct) * 100).toFixed(2).replace(/\.?0+$/, ""),
    timbres_rate: (Number(c.timbres_rate) * 100).toFixed(2).replace(/\.?0+$/, ""),
    use_pretax_extraction: c.use_pretax_extraction,
    mantenimiento_per_m2: c.mantenimiento_per_m2 != null ? String(c.mantenimiento_per_m2) : "",
    mantenimiento_label: c.mantenimiento_label ?? "",
    disclaimers: c.disclaimers ?? [],
    validity_days: String(c.validity_days),
    display_order: String(c.display_order),
  };
}

function formToPayload(f: FormData) {
  return {
    project_id: f.project_id,
    tower_id: f.tower_id || null,
    unit_type: f.unit_type?.trim() || null,
    label: f.label.trim(),
    currency: f.currency,
    enganche_pct: parseFloat(f.enganche_pct) / 100,
    min_enganche_pct: f.min_enganche_pct ? parseFloat(f.min_enganche_pct) / 100 : null,
    reserva_default: parseFloat(f.reserva_default),
    installment_months: parseInt(f.installment_months),
    round_enganche_q100: f.round_enganche_q100,
    round_cuota_q100: f.round_cuota_q100,
    round_cuota_q1: f.round_cuota_q1,
    round_saldo_q100: f.round_saldo_q100,
    bank_rates: f.bank_rates.map((r) => parseFloat(r) / 100),
    bank_rate_labels: f.bank_rate_labels.some((l) => l.trim()) ? f.bank_rate_labels.map((l) => l.trim()) : null,
    plazos_years: f.plazos_years.map((p) => parseInt(p)),
    include_seguro_in_cuota: f.include_seguro_in_cuota,
    include_iusi_in_cuota: f.include_iusi_in_cuota,
    seguro_enabled: f.seguro_enabled,
    seguro_base: f.seguro_base,
    iusi_frequency: f.iusi_frequency,
    income_multiplier: parseFloat(f.income_multiplier),
    income_base: f.income_base,
    inmueble_pct: parseFloat(f.inmueble_pct) / 100,
    timbres_rate: parseFloat(f.timbres_rate) / 100,
    use_pretax_extraction: f.use_pretax_extraction,
    mantenimiento_per_m2: f.mantenimiento_per_m2 ? parseFloat(f.mantenimiento_per_m2) : null,
    mantenimiento_label: f.mantenimiento_label.trim() || null,
    disclaimers: f.disclaimers.filter((d) => d.trim()),
    validity_days: parseInt(f.validity_days),
    display_order: parseInt(f.display_order),
  };
}

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */

export default function CotizadorConfigClient() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingConfig, setEditingConfig] = useState<ConfigRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, projRes] = await Promise.all([
        fetch("/api/admin/cotizador-config"),
        fetch("/api/reservas/projects"),
      ]);
      if (!cfgRes.ok) {
        const body = await cfgRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${cfgRes.status}`);
      }
      if (!projRes.ok) {
        const body = await projRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${projRes.status}`);
      }
      setConfigs(await cfgRes.json());
      setProjects(await projRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showMsg = useCallback((m: Msg) => {
    setMsg(m);
    if (m?.type === "ok") setTimeout(() => setMsg(null), 3000);
  }, []);

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

  function openCreate() {
    setEditingConfig(null);
    setModalMode("create");
  }

  function openEdit(config: ConfigRow) {
    setEditingConfig(config);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingConfig(null);
  }

  async function handleModalSave(formData: FormData, configId?: string) {
    const payload = formToPayload(formData);
    const isEdit = !!configId;
    const url = isEdit ? `/api/admin/cotizador-config/${configId}` : "/api/admin/cotizador-config";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? (() => {
        // For PATCH, omit project_id/tower_id/unit_type (scope is immutable)
        const { project_id: _p, tower_id: _t, unit_type: _u, ...rest } = payload;
        void _p; void _t; void _u;
        return rest;
      })() : payload),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error ?? `Error ${res.status}`);
    }

    showMsg({ type: "ok", text: isEdit ? "Configuración actualizada" : "Configuración creada" });
    closeModal();
    await fetchData();
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

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuración Cotizador</h1>
          <p className="text-sm text-muted mt-1">Parámetros por proyecto/torre/tipo de unidad</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          + Nueva configuración
        </button>
      </header>

      {msg && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            msg.type === "ok"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {msg.text}
          {msg.type === "err" && (
            <button type="button" className="ml-2 underline text-xs" onClick={() => setMsg(null)}>cerrar</button>
          )}
        </div>
      )}

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
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {projectConfigs.map((c) => (
                    <ConfigTableRow
                      key={c.id}
                      config={c}
                      expanded={expandedId === c.id}
                      toggling={toggling === c.id}
                      onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      onToggleActive={() => toggleActive(c.id, c.is_active)}
                      onEdit={() => openEdit(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      {modalMode && (
        <ConfigFormModal
          mode={modalMode}
          config={editingConfig}
          projects={projects}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Table row (extracted for keys)
   ═══════════════════════════════════════════════════════════════ */

function ConfigTableRow({
  config: c,
  expanded,
  toggling,
  onToggleExpand,
  onToggleActive,
  onEdit,
}: {
  config: ConfigRow;
  expanded: boolean;
  toggling: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-border/50 cursor-pointer hover:bg-white/5"
        onClick={onToggleExpand}
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
            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
            disabled={toggling}
            className={`w-8 h-5 rounded-full relative transition-colors ${c.is_active ? "bg-green-500" : "bg-gray-500"}`}
          >
            <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${c.is_active ? "translate-x-3.5" : "translate-x-0.5"}`} />
          </button>
        </td>
        <td className="py-2 px-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="px-2 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Editar
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50 bg-white/[0.02]">
          <td colSpan={9} className="px-5 py-4">
            <ConfigDetail config={c} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Detail row
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   Form modal (create + edit)
   ═══════════════════════════════════════════════════════════════ */

function ConfigFormModal({
  mode,
  config,
  projects,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  config: ConfigRow | null;
  projects: ProjectOption[];
  onSave: (form: FormData, configId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(() =>
    config ? configToForm(config) : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  // Towers for selected project
  const towersForProject = useMemo(() => {
    const p = projects.find((pr) => pr.project_id === form.project_id);
    return p?.towers ?? [];
  }, [projects, form.project_id]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleProjectChange(projectId: string) {
    set("project_id", projectId);
    set("tower_id", null);
  }

  // Array field helpers
  function addRate() {
    setForm((prev) => ({
      ...prev,
      bank_rates: [...prev.bank_rates, ""],
      bank_rate_labels: [...prev.bank_rate_labels, ""],
    }));
  }
  function removeRate(idx: number) {
    setForm((prev) => ({
      ...prev,
      bank_rates: prev.bank_rates.filter((_, i) => i !== idx),
      bank_rate_labels: prev.bank_rate_labels.filter((_, i) => i !== idx),
    }));
  }
  function setRate(idx: number, val: string) {
    setForm((prev) => {
      const next = [...prev.bank_rates];
      next[idx] = val;
      return { ...prev, bank_rates: next };
    });
  }
  function setRateLabel(idx: number, val: string) {
    setForm((prev) => {
      const next = [...prev.bank_rate_labels];
      next[idx] = val;
      return { ...prev, bank_rate_labels: next };
    });
  }
  function addPlazo() {
    setForm((prev) => ({ ...prev, plazos_years: [...prev.plazos_years, ""] }));
  }
  function removePlazo(idx: number) {
    setForm((prev) => ({ ...prev, plazos_years: prev.plazos_years.filter((_, i) => i !== idx) }));
  }
  function setPlazo(idx: number, val: string) {
    setForm((prev) => {
      const next = [...prev.plazos_years];
      next[idx] = val;
      return { ...prev, plazos_years: next };
    });
  }
  function addDisclaimer() {
    setForm((prev) => ({ ...prev, disclaimers: [...prev.disclaimers, ""] }));
  }
  function removeDisclaimer(idx: number) {
    setForm((prev) => ({ ...prev, disclaimers: prev.disclaimers.filter((_, i) => i !== idx) }));
  }
  function setDisclaimer(idx: number, val: string) {
    setForm((prev) => {
      const next = [...prev.disclaimers];
      next[idx] = val;
      return { ...prev, disclaimers: next };
    });
  }

  // Validation
  function validate(): string | null {
    if (!form.project_id) return "Selecciona un proyecto";
    if (!form.label.trim()) return "El label es requerido";
    const eng = parseFloat(form.enganche_pct);
    if (isNaN(eng) || eng < 0 || eng > 100) return "Enganche debe estar entre 0% y 100%";
    if (form.min_enganche_pct) {
      const minEng = parseFloat(form.min_enganche_pct);
      if (isNaN(minEng) || minEng < 0 || minEng > 100) return "Enganche mínimo debe estar entre 0% y 100%";
      if (minEng > eng) return "Enganche mínimo no puede ser mayor que el enganche default";
    }
    const reserva = parseFloat(form.reserva_default);
    if (isNaN(reserva) || reserva < 0) return "Reserva debe ser >= 0";
    const cuotas = parseInt(form.installment_months);
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 60) return "Cuotas debe estar entre 1 y 60";
    if (form.bank_rates.length === 0) return "Agrega al menos una tasa";
    for (let i = 0; i < form.bank_rates.length; i++) {
      const r = parseFloat(form.bank_rates[i]);
      if (isNaN(r) || r < 0 || r > 100) return `Tasa ${i + 1} inválida (0-100%)`;
    }
    if (form.plazos_years.length === 0) return "Agrega al menos un plazo";
    for (let i = 0; i < form.plazos_years.length; i++) {
      const p = parseInt(form.plazos_years[i]);
      if (isNaN(p) || p < 1 || p > 50) return `Plazo ${i + 1} inválido (1-50 años)`;
    }
    const mult = parseFloat(form.income_multiplier);
    if (isNaN(mult) || mult < 0 || mult > 10) return "Multiplicador de ingreso inválido";
    const inm = parseFloat(form.inmueble_pct);
    if (isNaN(inm) || inm < 0 || inm > 100) return "% inmueble debe estar entre 0% y 100%";
    const tim = parseFloat(form.timbres_rate);
    if (isNaN(tim) || tim < 0 || tim > 10) return "Tasa de timbres inválida";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);
    setSaving(true);
    try {
      await onSave(form, config?.id);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const selectCls = inputCls;
  const labelCls = "text-xs font-medium text-muted block mb-1";
  const sectionCls = "grid gap-3";
  const sectionTitle = "text-xs font-semibold uppercase tracking-wider text-muted border-b border-border pb-1 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-[680px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? "Editar configuración" : "Nueva configuración"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-text-primary text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid gap-5 max-h-[70vh] overflow-y-auto">
          {formError && (
            <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-sm">{formError}</div>
          )}

          {/* ── Alcance ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Alcance</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Proyecto *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  disabled={isEdit}
                  className={selectCls}
                >
                  <option value="">Seleccionar...</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Torre (opcional)</label>
                <select
                  value={form.tower_id ?? ""}
                  onChange={(e) => set("tower_id", e.target.value || null)}
                  disabled={isEdit || !form.project_id}
                  className={selectCls}
                >
                  <option value="">Todas las torres</option>
                  {towersForProject.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tipo de unidad (opcional)</label>
                <input
                  type="text"
                  value={form.unit_type ?? ""}
                  onChange={(e) => set("unit_type", e.target.value || null)}
                  disabled={isEdit}
                  placeholder="Ej: 208, Terraza, Local"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Label *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="Nombre descriptivo"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Enganche & Cuotas ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Enganche & Cuotas</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Moneda</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value as "GTQ" | "USD")} className={selectCls}>
                  <option value="GTQ">GTQ</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Enganche %</label>
                <input type="number" step="0.01" min="0" max="100" value={form.enganche_pct} onChange={(e) => set("enganche_pct", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Eng. mínimo %</label>
                <input type="number" step="0.01" min="0" max="100" placeholder="Sin mínimo" value={form.min_enganche_pct} onChange={(e) => set("min_enganche_pct", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reserva</label>
                <input type="number" step="1" min="0" value={form.reserva_default} onChange={(e) => set("reserva_default", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cuotas</label>
                <input type="number" step="1" min="1" max="60" value={form.installment_months} onChange={(e) => set("installment_months", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── Tasas Bancarias ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle + " mb-0 border-b-0 pb-0"}>Tasas Bancarias</div>
              <button type="button" onClick={addRate} className="text-xs text-primary hover:underline">+ Agregar tasa</button>
            </div>
            {form.bank_rates.map((rate, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  {i === 0 && <label className={labelCls}>Tasa %</label>}
                  <input type="number" step="0.01" min="0" max="100" value={rate} onChange={(e) => setRate(i, e.target.value)} className={inputCls} placeholder="Ej: 5.50" />
                </div>
                <div className="flex-1">
                  {i === 0 && <label className={labelCls}>Label (opcional)</label>}
                  <input type="text" value={form.bank_rate_labels[i] ?? ""} onChange={(e) => setRateLabel(i, e.target.value)} className={inputCls} placeholder="Ej: FHA" />
                </div>
                {form.bank_rates.length > 1 && (
                  <button type="button" onClick={() => removeRate(i)} className="text-red-400 hover:text-red-300 text-lg leading-none pb-2">&times;</button>
                )}
              </div>
            ))}
          </div>

          {/* ── Plazos ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle + " mb-0 border-b-0 pb-0"}>Plazos (años)</div>
              <button type="button" onClick={addPlazo} className="text-xs text-primary hover:underline">+ Agregar plazo</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.plazos_years.map((p, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input type="number" step="1" min="1" max="50" value={p} onChange={(e) => setPlazo(i, e.target.value)} className="w-16 px-2 py-2 rounded-lg border border-border bg-card text-text-primary text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {form.plazos_years.length > 1 && (
                    <button type="button" onClick={() => removePlazo(i)} className="text-red-400 hover:text-red-300 text-sm">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Redondeo ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Redondeo</div>
            <div className="grid grid-cols-2 gap-2">
              <CheckboxField label="Enganche → Q100" checked={form.round_enganche_q100} onChange={(v) => set("round_enganche_q100", v)} />
              <CheckboxField label="Cuota → Q100" checked={form.round_cuota_q100} onChange={(v) => set("round_cuota_q100", v)} />
              <CheckboxField label="Cuota → Q1" checked={form.round_cuota_q1} onChange={(v) => set("round_cuota_q1", v)} />
              <CheckboxField label="Saldo → Q100" checked={form.round_saldo_q100} onChange={(v) => set("round_saldo_q100", v)} />
            </div>
          </div>

          {/* ── Seguro & IUSI ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Seguro & IUSI</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <CheckboxField label="Seguro habilitado" checked={form.seguro_enabled} onChange={(v) => set("seguro_enabled", v)} />
              {form.seguro_enabled && (
                <>
                  <div>
                    <label className={labelCls}>Base del seguro</label>
                    <select value={form.seguro_base} onChange={(e) => set("seguro_base", e.target.value as "price" | "monto_financiar")} className={selectCls}>
                      <option value="price">Precio</option>
                      <option value="monto_financiar">Monto a financiar</option>
                    </select>
                  </div>
                  <CheckboxField label="Incluir seguro en cuota" checked={form.include_seguro_in_cuota} onChange={(v) => set("include_seguro_in_cuota", v)} />
                </>
              )}
              <CheckboxField label="Incluir IUSI en cuota" checked={form.include_iusi_in_cuota} onChange={(v) => set("include_iusi_in_cuota", v)} />
              <div>
                <label className={labelCls}>Frecuencia IUSI</label>
                <select value={form.iusi_frequency} onChange={(e) => set("iusi_frequency", e.target.value as "monthly" | "quarterly")} className={selectCls}>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Ingreso ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Ingreso Requerido</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Multiplicador</label>
                <input type="number" step="0.01" min="0" max="10" value={form.income_multiplier} onChange={(e) => set("income_multiplier", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Base</label>
                <select value={form.income_base} onChange={(e) => set("income_base", e.target.value as "cuota_banco" | "cuota_mensual")} className={selectCls}>
                  <option value="cuota_banco">Cuota banco</option>
                  <option value="cuota_mensual">Cuota mensual</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Escrituración ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Escrituración</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>% Inmueble</label>
                <input type="number" step="0.01" min="0" max="100" value={form.inmueble_pct} onChange={(e) => set("inmueble_pct", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tasa timbres %</label>
                <input type="number" step="0.01" min="0" max="10" value={form.timbres_rate} onChange={(e) => set("timbres_rate", e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-end pb-2">
                <CheckboxField label="Pre-tax extraction" checked={form.use_pretax_extraction} onChange={(v) => set("use_pretax_extraction", v)} />
              </div>
            </div>
          </div>

          {/* ── Mantenimiento ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Mantenimiento</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monto por m²</label>
                <input type="number" step="0.01" min="0" value={form.mantenimiento_per_m2} onChange={(e) => set("mantenimiento_per_m2", e.target.value)} className={inputCls} placeholder="Dejar vacío si N/A" />
              </div>
              <div>
                <label className={labelCls}>Label</label>
                <input type="text" value={form.mantenimiento_label} onChange={(e) => set("mantenimiento_label", e.target.value)} className={inputCls} placeholder="Ej: Pendiente" />
              </div>
            </div>
          </div>

          {/* ── Disclaimers ── */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle + " mb-0 border-b-0 pb-0"}>Disclaimers</div>
              <button type="button" onClick={addDisclaimer} className="text-xs text-primary hover:underline">+ Agregar</button>
            </div>
            {form.disclaimers.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={d} onChange={(e) => setDisclaimer(i, e.target.value)} className={inputCls + " flex-1"} placeholder="Texto del disclaimer" />
                <button type="button" onClick={() => removeDisclaimer(i)} className="text-red-400 hover:text-red-300 text-lg leading-none">&times;</button>
              </div>
            ))}
          </div>

          {/* ── Otros ── */}
          <div className={sectionCls}>
            <div className={sectionTitle}>Otros</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Validez (días)</label>
                <input type="number" step="1" min="0" value={form.validity_days} onChange={(e) => set("validity_days", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Orden de despliegue</label>
                <input type="number" step="1" min="0" value={form.display_order} onChange={(e) => set("display_order", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted text-sm font-medium hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear configuración"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Checkbox helper
   ═══════════════════════════════════════════════════════════════ */

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-border accent-primary"
      />
      {label}
    </label>
  );
}
