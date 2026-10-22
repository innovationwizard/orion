"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SiteNav from "@/components/site-nav";
import {
  CITAS_POR_DIA,
  DIA_LABELS,
  DIA_NO_HABIL_MENSAJE,
  ESTADO_COLORS,
  ESTADO_LABELS,
  ESTADOS,
  HORAS_SUGERIDAS,
  MESES,
  MILESTONE_LABELS,
  MILESTONE_SHORT,
  MILESTONES,
  TIPO_PAGO_LABELS,
  TIPOS_PAGO,
  isDiaHabil,
} from "@/lib/entregas/constants";
import type {
  EntregaCandidato,
  EntregaCitaFull,
  EntregaEstado,
  EntregaMilestone,
  EntregaTipoPago,
} from "@/lib/entregas/types";

// ---------------------------------------------------------------------------
// Date helpers — all local-time. Parsing an ISO date with `new Date(iso)`
// treats it as UTC and shifts the day in GMT-6, so it is done by parts.
// ---------------------------------------------------------------------------

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week containing `date`. */
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const dayFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDayMonth(date: Date): string {
  return `${date.getDate()} ${MESES[date.getMonth()].slice(0, 3)}`;
}

function fmtFechaLarga(iso: string): string {
  const d = parseLocalDate(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function fmtFechaCorta(iso: string): string {
  const d = parseLocalDate(iso);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** Postgres returns HH:MM:SS; the pickers use HH:MM. */
function toInputTime(hora: string): string {
  return hora.slice(0, 5);
}

function fmtHora(hora: string): string {
  const [h, m] = toInputTime(hora).split(":").map(Number);
  const period = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// ---------------------------------------------------------------------------
// Grouping — one physical appointment, one card
// ---------------------------------------------------------------------------

/**
 * A slot on the board: the citas a client attends in a single visit. Usually
 * one milestone; two when the escritura is signed and the keys handed over in
 * the same appointment.
 */
interface CitaGroup {
  key: string;
  citas: EntregaCitaFull[];
}

function milestoneOrder(milestone: EntregaMilestone): number {
  return MILESTONES.indexOf(milestone);
}

/**
 * Two milestones of the same unit at the same date and hour are one visit, so
 * they share a card, one slot of the daily capacity, and one detail modal.
 *
 * A cancelled cita never joins a group: what was cancelled is its own record
 * and must stay visible as such next to whatever still stands.
 */
function groupKeyOf(cita: EntregaCitaFull): string {
  if (cita.estado === "CANCELADA") return `cita:${cita.cita_id}`;
  return `slot:${cita.entrega_id}|${cita.fecha}|${toInputTime(cita.hora)}`;
}

function groupCitas(citas: EntregaCitaFull[]): CitaGroup[] {
  const buckets = new Map<string, EntregaCitaFull[]>();
  for (const cita of citas) {
    const key = groupKeyOf(cita);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(cita);
    else buckets.set(key, [cita]);
  }

  const groups: CitaGroup[] = [];
  for (const [key, list] of buckets) {
    list.sort((a, b) => milestoneOrder(a.milestone) - milestoneOrder(b.milestone));
    groups.push({ key, citas: list });
  }

  groups.sort((a, b) => {
    const [x, y] = [a.citas[0], b.citas[0]];
    if (x.hora !== y.hora) return x.hora.localeCompare(y.hora);
    return milestoneOrder(x.milestone) - milestoneOrder(y.milestone);
  });
  return groups;
}

/** One editable value per cita, keyed by cita_id. */
function porCita<T>(citas: EntregaCitaFull[], pick: (cita: EntregaCitaFull) => T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const cita of citas) out[cita.cita_id] = pick(cita);
  return out;
}

/** Milestones of a group, as the operator says them: "Escrituración y entrega de llaves". */
function hitosLabel(citas: EntregaCitaFull[]): string {
  return citas
    .map((c, i) =>
      i === 0 ? MILESTONE_LABELS[c.milestone] : MILESTONE_LABELS[c.milestone].toLowerCase(),
    )
    .join(" y ");
}

/** A visit is a draft while any of its citas is still unpublished. */
function esBorrador(citas: EntregaCitaFull[]): boolean {
  return citas.some((c) => c.publicada === false);
}

// ---------------------------------------------------------------------------
// Presentation tokens — Boulevard 5 palette
// ---------------------------------------------------------------------------

const NAVY_BG =
  "radial-gradient(1100px 620px at 12% -10%, rgba(5,115,176,0.35), transparent 60%)," +
  "radial-gradient(900px 560px at 110% 10%, rgba(4,176,214,0.22), transparent 55%)," +
  "radial-gradient(1200px 800px at 50% 120%, rgba(5,115,176,0.18), transparent 60%)," +
  "linear-gradient(160deg, #030328 0%, #0a052c 55%, #070420 100%)";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 22,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 10,
  color: "rgba(255,255,255,0.96)",
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  marginBottom: 5,
  display: "block",
};

function buttonStyle(variant: "primary" | "ghost" | "danger"): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "opacity .15s ease",
  };
  if (variant === "primary") {
    return { ...base, background: "#04b0d6", border: "1px solid #04b0d6", color: "#030328" };
  }
  if (variant === "danger") {
    return {
      ...base,
      background: "rgba(255,128,149,0.12)",
      border: "1px solid rgba(255,128,149,0.42)",
      color: "#ff8095",
    };
  }
  return {
    ...base,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.88)",
  };
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function EstadoChip({ estado }: { estado: EntregaEstado }) {
  const c = ESTADO_COLORS[estado];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

function BorradorChip() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        color: "#ffd79a",
        background: "rgba(255,215,154,0.12)",
        border: "1px solid rgba(255,215,154,0.38)",
        whiteSpace: "nowrap",
      }}
    >
      Borrador
    </span>
  );
}

function MilestoneChip({ milestone }: { milestone: EntregaMilestone }) {
  const isEscritura = milestone === "ESCRITURA";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        color: isEscritura ? "#c9b6ff" : "#ffd79a",
        background: isEscritura ? "rgba(201,182,255,0.12)" : "rgba(255,215,154,0.12)",
        border: `1px solid ${isEscritura ? "rgba(201,182,255,0.32)" : "rgba(255,215,154,0.32)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {MILESTONE_SHORT[milestone]}
    </span>
  );
}

function ReprogramadaChip({ veces }: { veces: number }) {
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        color: "#ffd79a",
        background: "rgba(255,215,154,0.12)",
        border: "1px solid rgba(255,215,154,0.32)",
        whiteSpace: "nowrap",
      }}
    >
      Reprogramada ×{veces}
    </span>
  );
}

function StatCard({
  num,
  label,
  accent,
  disabled,
  onClick,
}: {
  num: number;
  label: string;
  accent?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-haspopup="dialog"
      aria-label={`${label}: ${num}. Ver las filas que suman este número.`}
      style={{
        ...glass,
        borderRadius: 16,
        padding: "14px 18px",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit",
        width: "100%",
        height: "100%",
        display: "block",
        cursor: disabled ? "default" : "pointer",
        ...(accent ? { borderColor: "rgba(4,176,214,0.45)" } : {}),
        ...(hover && !disabled
          ? {
              borderColor: accent ? "rgba(4,176,214,0.75)" : "rgba(255,255,255,0.34)",
              background: "rgba(255,255,255,0.09)",
            }
          : {}),
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{num}</div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{label}</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// KPI breakdown — the rows behind each card
//
// The five numbers are not the same kind of thing. The modal for a card lists
// exactly the rows that produce its number, so the two cannot drift:
//   hitos        — one row per cita
//   completadas  — one row per entrega whose two hitos are both COMPLETADA
//   confirmadas  — one row per visit slot that has a CONFIRMADA cita
//   programadas  — one row per visit slot that has a PROGRAMADA cita
//   atencion     — one row per cita that is cancelled, or rescheduled and open
// ---------------------------------------------------------------------------

type KpiId = "hitos" | "completadas" | "confirmadas" | "programadas" | "atencion";

interface KpiRow {
  key: string;
  anchor: EntregaCitaFull;
  /** Citas whose existence puts this row in the count. The matching date cell is marked. */
  countedIds: ReadonlySet<string>;
  escritura: EntregaCitaFull | null;
  llaves: EntregaCitaFull | null;
  /** Why the row is under "Requieren atención". Null on the other cards. */
  atencion: string | null;
}

const KPI_DETALLE: Record<KpiId, { titulo: string; detalle: string }> = {
  hitos: {
    titulo: "Hitos agendados",
    detalle:
      "Cada fila es un hito. Una unidad con escrituración y entrega de llaves aparece dos veces.",
  },
  completadas: {
    titulo: "Entregas completadas",
    detalle:
      "Cada fila es una unidad con la escrituración y la entrega de llaves ya completadas.",
  },
  confirmadas: {
    titulo: "Confirmadas",
    detalle:
      "Cada fila es una visita. Escrituración y llaves en la misma fecha y hora cuentan como una.",
  },
  programadas: {
    titulo: "Programadas",
    detalle:
      "Cada fila es una visita. Escrituración y llaves en la misma fecha y hora cuentan como una.",
  },
  atencion: {
    titulo: "Requieren atención",
    detalle: "Cada fila es un hito cancelado, o reprogramado que todavía no se completa.",
  },
};

const KPI_ORDER: { id: KpiId; accent: boolean }[] = [
  { id: "hitos", accent: false },
  { id: "completadas", accent: false },
  { id: "confirmadas", accent: true },
  { id: "programadas", accent: false },
  { id: "atencion", accent: false },
];

function cmpCita(a: EntregaCitaFull, b: EntregaCitaFull): number {
  if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
  if (a.hora !== b.hora) return a.hora.localeCompare(b.hora);
  const unit = a.unit_number.localeCompare(b.unit_number, "es", { numeric: true });
  if (unit !== 0) return unit;
  return milestoneOrder(a.milestone) - milestoneOrder(b.milestone);
}

function citasPorEntrega(citas: EntregaCitaFull[]): Map<string, EntregaCitaFull[]> {
  const map = new Map<string, EntregaCitaFull[]>();
  for (const cita of citas) {
    const list = map.get(cita.entrega_id);
    if (list) list.push(cita);
    else map.set(cita.entrega_id, [cita]);
  }
  return map;
}

function kpiRow(
  key: string,
  anchor: EntregaCitaFull,
  counted: EntregaCitaFull[],
  porEntrega: Map<string, EntregaCitaFull[]>,
  atencion: string | null,
): KpiRow {
  const todas = porEntrega.get(anchor.entrega_id) ?? counted;
  return {
    key,
    anchor,
    countedIds: new Set(counted.map((c) => c.cita_id)),
    escritura: todas.find((c) => c.milestone === "ESCRITURA") ?? null,
    llaves: todas.find((c) => c.milestone === "LLAVES") ?? null,
    atencion,
  };
}

function motivoAtencion(cita: EntregaCitaFull): string {
  const partes: string[] = [];
  if (cita.estado === "CANCELADA") {
    partes.push(cita.cancelada_motivo ? `Cancelada: ${cita.cancelada_motivo}` : "Cancelada");
  }
  if (cita.reprogramaciones > 0 && cita.estado !== "COMPLETADA") {
    partes.push(`Reprogramada ×${cita.reprogramaciones}`);
  }
  return partes.join(" · ");
}

function filasPorEstado(
  filtered: EntregaCitaFull[],
  estado: EntregaEstado,
  porEntrega: Map<string, EntregaCitaFull[]>,
): KpiRow[] {
  const keys = new Set(filtered.filter((c) => c.estado === estado).map(groupKeyOf));
  const rows: KpiRow[] = [];
  for (const key of keys) {
    const members = filtered
      .filter((c) => groupKeyOf(c) === key)
      .sort((a, b) => milestoneOrder(a.milestone) - milestoneOrder(b.milestone));
    const counted = members.filter((c) => c.estado === estado);
    const anchor = counted[0];
    if (!anchor) continue;
    rows.push(kpiRow(key, anchor, counted, porEntrega, null));
  }
  rows.sort((a, b) => cmpCita(a.anchor, b.anchor));
  return rows;
}

/**
 * Rows behind each KPI. `all` supplies the other hito of a unit when the board
 * filter hid it, so every row can still show both event dates. Membership —
 * and therefore the number on the card — comes only from `filtered`.
 */
function filasKpi(filtered: EntregaCitaFull[], all: EntregaCitaFull[]): Record<KpiId, KpiRow[]> {
  const porEntrega = citasPorEntrega(all);

  const hitos = [...filtered]
    .sort(cmpCita)
    .map((c) => kpiRow(c.cita_id, c, [c], porEntrega, null));

  const completadas: KpiRow[] = [];
  const hechas = new Map<string, EntregaCitaFull[]>();
  for (const c of filtered) {
    if (c.estado !== "COMPLETADA") continue;
    const list = hechas.get(c.entrega_id);
    if (list) list.push(c);
    else hechas.set(c.entrega_id, [c]);
  }
  for (const [entregaId, list] of hechas) {
    const have = new Set(list.map((c) => c.milestone));
    if (!MILESTONES.every((m) => have.has(m))) continue;
    list.sort((a, b) => milestoneOrder(a.milestone) - milestoneOrder(b.milestone));
    completadas.push(kpiRow(entregaId, list[0], list, porEntrega, null));
  }
  completadas.sort((a, b) =>
    cmpCita(a.escritura ?? a.anchor, b.escritura ?? b.anchor),
  );

  const atencion = filtered
    .filter(
      (c) => c.estado === "CANCELADA" || (c.reprogramaciones > 0 && c.estado !== "COMPLETADA"),
    )
    .sort(cmpCita)
    .map((c) => kpiRow(c.cita_id, c, [c], porEntrega, motivoAtencion(c)));

  return {
    hitos,
    completadas,
    confirmadas: filasPorEstado(filtered, "CONFIRMADA", porEntrega),
    programadas: filasPorEstado(filtered, "PROGRAMADA", porEntrega),
    atencion,
  };
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

interface Props {
  canEdit: boolean;
  canPublish: boolean;
}

type Filters = {
  q: string;
  milestone: "" | EntregaMilestone;
  estado: "" | EntregaEstado;
};

export default function EntregasClient({ canEdit, canPublish }: Props) {
  const [citas, setCitas] = useState<EntregaCitaFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filters, setFilters] = useState<Filters>({ q: "", milestone: "", estado: "" });
  /** The citas of the open slot — one, or both milestones of a shared visit. */
  const [detalle, setDetalle] = useState<EntregaCitaFull[] | null>(null);
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [kpiAbierto, setKpiAbierto] = useState<KpiId | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publicando, setPublicando] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/entregas", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
      setCitas(body.citas as EntregaCitaFull[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el cronograma");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the open detail card in sync after an edit. Members are tracked by id,
  // so deleting one milestone of a shared visit leaves the other one open.
  useEffect(() => {
    if (!detalle) return;
    const fresh = detalle
      .map((d) => citas.find((c) => c.cita_id === d.cita_id))
      .filter((c): c is EntregaCitaFull => c !== undefined);
    if (fresh.length === 0) {
      setDetalle(null);
      return;
    }
    const changed =
      fresh.length !== detalle.length ||
      fresh.some((c, i) => c.cita_updated_at !== detalle[i].cita_updated_at);
    if (changed) setDetalle(fresh);
  }, [citas, detalle]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return citas.filter((c) => {
      if (filters.milestone && c.milestone !== filters.milestone) return false;
      if (filters.estado && c.estado !== filters.estado) return false;
      if (q) {
        const hay = `${c.cliente ?? ""} ${c.unit_number} ${c.unit_code ?? ""} ${c.banco ?? ""}`;
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [citas, filters]);

  const filas = useMemo(() => filasKpi(filtered, citas), [filtered, citas]);
  const filteredIds = useMemo(() => new Set(filtered.map((c) => c.cita_id)), [filtered]);
  const cardsDisabled = loading && citas.length === 0;

  const monday = useMemo(
    () => addDays(mondayOf(new Date()), weekOffset * 7),
    [weekOffset],
  );

  const weekDays = useMemo(
    () => Array.from({ length: DIA_LABELS.length }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const weekIsos = useMemo(() => weekDays.map(isoOf), [weekDays]);

  const gruposByDay = useMemo(() => {
    const byDay = new Map<string, EntregaCitaFull[]>();
    for (const iso of weekIsos) byDay.set(iso, []);
    for (const cita of filtered) {
      const bucket = byDay.get(cita.fecha);
      if (bucket) bucket.push(cita);
    }
    const map = new Map<string, CitaGroup[]>();
    for (const [iso, list] of byDay) map.set(iso, groupCitas(list));
    return map;
  }, [filtered, weekIsos]);

  /** Next scheduled cita outside the visible week — lets the user jump to real work. */
  const proxima = useMemo(() => {
    const todayIso = isoOf(new Date());
    const upcoming = filtered
      .filter((c) => c.estado !== "CANCELADA" && c.fecha >= todayIso)
      .sort((a, b) => (a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha)));
    return upcoming[0] ?? null;
  }, [filtered]);

  const proximaFueraDeSemana =
    proxima !== null && !weekIsos.includes(proxima.fecha) ? proxima : null;

  /** The whole visit, so the hint names both hitos when they share the slot. */
  const proximaHitos = useMemo(() => {
    if (!proximaFueraDeSemana) return "";
    const key = groupKeyOf(proximaFueraDeSemana);
    const grupo = filtered
      .filter((c) => groupKeyOf(c) === key)
      .sort((a, b) => milestoneOrder(a.milestone) - milestoneOrder(b.milestone));
    return hitosLabel(grupo).toLowerCase();
  }, [filtered, proximaFueraDeSemana]);

  const jumpToCita = useCallback((cita: EntregaCitaFull) => {
    const target = mondayOf(parseLocalDate(cita.fecha));
    const current = mondayOf(new Date());
    const diffWeeks = Math.round(
      (target.getTime() - current.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    setWeekOffset(diffWeeks);
  }, []);

  const applyCitas = useCallback((updated: EntregaCitaFull[]) => {
    if (updated.length === 0) return;
    setCitas((prev) => {
      const next = [...prev];
      for (const cita of updated) {
        const idx = next.findIndex((c) => c.cita_id === cita.cita_id);
        if (idx === -1) next.push(cita);
        else next[idx] = cita;
      }
      return next;
    });
  }, []);

  const publicar = useCallback(
    async (grupo: EntregaCitaFull[]) => {
      const anchor = grupo.find((c) => c.publicada === false);
      if (!anchor) return;
      const res = await fetch(`/api/entregas/citas/${anchor.cita_id}/publicar`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
      applyCitas(body.citas as EntregaCitaFull[]);
    },
    [applyCitas],
  );

  // The detail modal stays open if the visit still has another milestone; the
  // sync effect above closes it once nothing is left.
  const removeCita = useCallback((citaId: string) => {
    setCitas((prev) => prev.filter((c) => c.cita_id !== citaId));
  }, []);

  /**
   * A titular renamed in one modal is the same person on every other cita —
   * the other hito of the visit, and any other unit they own. Patch them all so
   * the board never shows two spellings of one client at once.
   */
  const applyRenames = useCallback((cambios: { client_id: string; full_name: string }[]) => {
    if (cambios.length === 0) return;
    const porId = new Map(cambios.map((c) => [c.client_id, c.full_name]));
    setCitas((prev) =>
      prev.map((cita) => {
        const titulares = cita.titulares ?? [];
        if (!titulares.some((t) => porId.has(t.client_id))) return cita;
        const next = titulares.map((t) =>
          porId.has(t.client_id) ? { ...t, full_name: porId.get(t.client_id)! } : t,
        );
        const primary = next.find((t) => t.is_primary);
        return { ...cita, titulares: next, cliente: primary?.full_name ?? cita.cliente };
      }),
    );
  }, []);

  const weekEnd = weekDays[weekDays.length - 1];
  const weekLabel = `${fmtDayMonth(weekDays[0])} – ${fmtDayMonth(weekEnd)}, ${weekEnd.getFullYear()}`;
  const todayIso = isoOf(new Date());

  return (
    <>
      <SiteNav />

      <div
        style={{
          background: NAVY_BG,
          borderRadius: 24,
          padding: "clamp(14px, 2.4vw, 26px)",
          minHeight: "70vh",
          color: "rgba(255,255,255,0.96)",
          fontFamily: "inherit",
        }}
      >
        {/* ---------- Header ---------- */}
        <header
          style={{
            ...glass,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "14px 20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Image
              src="/brand/puerta-abierta.png"
              alt="Puerta Abierta Inmobiliaria"
              width={140}
              height={79}
              style={{ height: 38, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.95 }}
              priority
            />
            <span style={{ width: 1, height: 30, background: "rgba(255,255,255,0.18)" }} />
            <Image
              src="/brand/boulevard-5.png"
              alt="Boulevard 5"
              width={140}
              height={32}
              style={{ height: 21, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.95 }}
              priority
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Puerta Abierta Inmobiliaria</div>
            <div style={{ fontSize: 12.5, color: "#04b0d6", fontWeight: 600 }}>
              Cronograma de Entregas · Boulevard 5
            </div>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section style={{ ...glass, padding: "18px 22px", marginTop: 14 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
            Escrituración y entrega de unidades
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.62)",
              margin: "7px 0 0",
              maxWidth: 780,
              lineHeight: 1.55,
            }}
          >
            La escrituración y la entrega de llaves se agendan por separado, o juntas en una
            misma cita cuando el cliente firma y recibe llaves en la misma visita. Cada hito
            conserva su propio estado y su historial de reprogramaciones.
            {canPublish
              ? " Una cita nueva queda en borrador hasta que se publica la visita."
              : ""}
          </p>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 13 }}>
            {[
              { dot: "#04b0d6", text: `${CITAS_POR_DIA} citas por día` },
              { dot: "#0573b0", text: "9:00 a.m. – 6:00 p.m." },
              { dot: "#4ee9ab", text: "Lunes a sábado" },
            ].map((b) => (
              <span
                key={b.text}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 11.5,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: 999, background: b.dot }}
                  aria-hidden
                />
                {b.text}
              </span>
            ))}
          </div>
        </section>

        {/* ---------- Error ---------- */}
        {error && (
          <div
            role="alert"
            style={{
              ...glass,
              marginTop: 14,
              padding: "12px 18px",
              borderColor: "rgba(255,128,149,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "#ff8095" }}>{error}</span>
            <button type="button" style={buttonStyle("ghost")} onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        {publishError && (
          <div
            role="alert"
            style={{
              ...glass,
              marginTop: 14,
              padding: "12px 18px",
              borderColor: "rgba(255,128,149,0.4)",
            }}
          >
            <span style={{ fontSize: 13, color: "#ff8095" }}>{publishError}</span>
          </div>
        )}

        {/* ---------- Stats ---------- */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          {KPI_ORDER.map(({ id, accent }) => (
            <StatCard
              key={id}
              num={filas[id].length}
              label={KPI_DETALLE[id].titulo}
              accent={accent}
              disabled={cardsDisabled}
              onClick={() => setKpiAbierto(id)}
            />
          ))}
        </section>

        {/* ---------- Toolbar ---------- */}
        <section
          style={{
            ...glass,
            marginTop: 14,
            padding: "12px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Buscar cliente, apartamento o banco…"
            aria-label="Buscar en el cronograma"
            style={{ ...inputStyle, flex: "1 1 240px", width: "auto" }}
          />
          <select
            className="dark-select"
            value={filters.milestone}
            onChange={(e) =>
              setFilters((f) => ({ ...f, milestone: e.target.value as Filters["milestone"] }))
            }
            aria-label="Filtrar por hito"
            style={{ ...inputStyle, width: "auto" }}
          >
            <option value="">Todos los hitos</option>
            {MILESTONES.map((m) => (
              <option key={m} value={m}>
                {MILESTONE_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            className="dark-select"
            value={filters.estado}
            onChange={(e) =>
              setFilters((f) => ({ ...f, estado: e.target.value as Filters["estado"] }))
            }
            aria-label="Filtrar por estado"
            style={{ ...inputStyle, width: "auto" }}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABELS[e]}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <button type="button" style={buttonStyle("ghost")} onClick={() => setWeekOffset(0)}>
              Hoy
            </button>
            <button
              type="button"
              aria-label="Semana anterior"
              style={{ ...buttonStyle("ghost"), padding: "8px 12px" }}
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                minWidth: 150,
                textAlign: "center",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {weekLabel}
            </span>
            <button
              type="button"
              aria-label="Semana siguiente"
              style={{ ...buttonStyle("ghost"), padding: "8px 12px" }}
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              ›
            </button>
            {canEdit && (
              <button type="button" style={buttonStyle("primary")} onClick={() => setAgendarOpen(true)}>
                Agendar cita
              </button>
            )}
          </div>
        </section>

        {/* ---------- Jump hint ---------- */}
        {!loading && proximaFueraDeSemana && (
          <div
            style={{
              ...glass,
              marginTop: 12,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 12.5,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            <span>
              Próxima cita: {proximaHitos} del apartamento {proximaFueraDeSemana.unit_number}, el{" "}
              {fmtFechaLarga(proximaFueraDeSemana.fecha)}.
            </span>
            <button
              type="button"
              style={{ ...buttonStyle("ghost"), padding: "6px 13px" }}
              onClick={() => jumpToCita(proximaFueraDeSemana)}
            >
              Ir a esa semana
            </button>
          </div>
        )}

        {/* ---------- Calendar ---------- */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          {weekDays.map((day, i) => {
            const iso = isoOf(day);
            const dayGrupos = gruposByDay.get(iso) ?? [];
            // Capacity is counted in visits, not in hitos: a client who signs and
            // receives the keys in one appointment occupies one slot.
            const activos = dayGrupos.filter((g) =>
              g.citas.some((c) => c.estado !== "CANCELADA"),
            );
            const isToday = iso === todayIso;
            const sobrecupo = activos.length > CITAS_POR_DIA;

            // Two different visits sharing an hour is a scheduling accident worth
            // showing. The two hitos of a single visit are not.
            const horasVistas = new Set<string>();
            const horasDuplicadas = new Set<string>();
            for (const g of activos) {
              const h = toInputTime(g.citas[0].hora);
              if (horasVistas.has(h)) horasDuplicadas.add(h);
              horasVistas.add(h);
            }

            return (
              <div
                key={iso}
                style={{
                  ...glass,
                  padding: 0,
                  overflow: "hidden",
                  opacity: dayGrupos.length === 0 ? 0.72 : 1,
                  ...(isToday ? { borderColor: "rgba(4,176,214,0.55)" } : {}),
                }}
              >
                <div
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                    background: isToday ? "rgba(4,176,214,0.10)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{DIA_LABELS[i]}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.52)" }}>
                    {fmtDayMonth(day)}
                    {isToday ? " · hoy" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      marginTop: 4,
                      color: sobrecupo ? "#ffd79a" : "rgba(255,255,255,0.40)",
                    }}
                  >
                    {activos.length} de {CITAS_POR_DIA}
                    {sobrecupo ? " · sobre cupo" : ""}
                  </div>
                </div>

                <div style={{ padding: 10, display: "grid", gap: 8 }}>
                  {dayGrupos.length === 0 ? (
                    <div
                      style={{
                        padding: "16px 10px",
                        textAlign: "center",
                        fontSize: 11.5,
                        color: "rgba(255,255,255,0.34)",
                        border: "1px dashed rgba(255,255,255,0.12)",
                        borderRadius: 12,
                      }}
                    >
                      Sin citas
                    </div>
                  ) : (
                    dayGrupos.map((grupo) => {
                      const principal = grupo.citas[0];
                      const cancelado = grupo.citas.every((c) => c.estado === "CANCELADA");
                      const horaChocada =
                        !cancelado && horasDuplicadas.has(toInputTime(principal.hora));
                      // One estado chip while both hitos agree; one per hito once
                      // the visit goes half-right (escritura firmada, llaves no).
                      const estadoComun = grupo.citas.every((c) => c.estado === principal.estado)
                        ? principal.estado
                        : null;
                      const reprogramaciones = Math.max(
                        ...grupo.citas.map((c) => c.reprogramaciones),
                      );
                      const borrador = canPublish && esBorrador(grupo.citas);

                      return (
                        <div key={grupo.key} style={{ display: "grid", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setDetalle(grupo.citas)}
                          style={{
                            textAlign: "left",
                            background: "rgba(255,255,255,0.055)",
                            border: borrador
                              ? "1px solid rgba(255,215,154,0.45)"
                              : "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            padding: "10px 12px",
                            cursor: "pointer",
                            color: "inherit",
                            fontFamily: "inherit",
                            display: "grid",
                            gap: 5,
                            opacity: cancelado ? 0.55 : 1,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: horaChocada ? "#ffd79a" : "#04b0d6",
                              fontWeight: 700,
                            }}
                          >
                            {fmtHora(principal.hora)}
                            {horaChocada ? " · hora duplicada" : ""}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                            {principal.cliente ?? "Sin titular registrado"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.52)" }}>
                            Apto. {principal.unit_number}
                            {principal.tipo_pago
                              ? ` · ${TIPO_PAGO_LABELS[principal.tipo_pago]}`
                              : ""}
                          </div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
                            {estadoComun !== null ? (
                              <>
                                {grupo.citas.map((c) => (
                                  <MilestoneChip key={c.cita_id} milestone={c.milestone} />
                                ))}
                                <EstadoChip estado={estadoComun} />
                              </>
                            ) : (
                              grupo.citas.map((c) => (
                                <span
                                  key={c.cita_id}
                                  style={{ display: "flex", gap: 5, flexBasis: "100%" }}
                                >
                                  <MilestoneChip milestone={c.milestone} />
                                  <EstadoChip estado={c.estado} />
                                </span>
                              ))
                            )}
                            {reprogramaciones > 0 && (
                              <ReprogramadaChip veces={reprogramaciones} />
                            )}
                            {borrador && <BorradorChip />}
                          </div>
                        </button>
                        {borrador && (
                          <button
                            type="button"
                            style={{ ...buttonStyle("primary"), padding: "6px 10px", fontSize: 12 }}
                            disabled={publicando !== null}
                            onClick={() => {
                              if (publicando !== null) return;
                              const key = grupo.key;
                              setPublishError(null);
                              setPublicando(key);
                              void publicar(grupo.citas)
                                .catch((e: unknown) => {
                                  setPublishError(
                                    e instanceof Error ? e.message : "No se pudo publicar",
                                  );
                                })
                                .finally(() => {
                                  setPublicando((current) => (current === key ? null : current));
                                });
                            }}
                          >
                            {publicando === grupo.key ? "Publicando…" : "Publicar"}
                          </button>
                        )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {loading && (
          <div
            style={{
              marginTop: 14,
              fontSize: 12.5,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
            }}
          >
            Cargando cronograma…
          </div>
        )}

        {!loading && !error && citas.length === 0 && (
          <div style={{ ...glass, marginTop: 14, padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>El cronograma está vacío</div>
            <p
              style={{
                fontSize: 12.5,
                color: "rgba(255,255,255,0.55)",
                margin: "7px auto 0",
                maxWidth: 520,
                lineHeight: 1.55,
              }}
            >
              {canEdit
                ? "Agenda la primera escrituración o entrega de llaves para empezar a llenar la agenda semanal."
                : "Aún no se ha agendado ninguna cita de escrituración o entrega."}
            </p>
          </div>
        )}

        {/* ---------- Footer ---------- */}
        <footer
          style={{
            ...glass,
            marginTop: 16,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", letterSpacing: 0.6 }}>
              ALIADOS DEL PROYECTO
            </span>
            <Image
              src="/brand/forma.png"
              alt="Forma"
              width={51}
              height={31}
              style={{ height: 24, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.6 }}
            />
            <Image
              src="/brand/grupo-orion.png"
              alt="Grupo Orión"
              width={70}
              height={42}
              style={{ height: 24, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.6 }}
            />
          </div>
        </footer>
      </div>

      {kpiAbierto && (
        <KpiModal
          kpi={kpiAbierto}
          rows={filas[kpiAbierto]}
          filteredIds={filteredIds}
          filters={filters}
          canPublish={canPublish}
          onClose={() => setKpiAbierto(null)}
        />
      )}

      {detalle && (
        <DetalleModal
          key={detalle.map((c) => c.cita_id).join("|")}
          citas={detalle}
          canEdit={canEdit}
          canPublish={canPublish}
          onClose={() => setDetalle(null)}
          onSaved={applyCitas}
          onPublish={publicar}
          onDeleted={removeCita}
          onRenamed={applyRenames}
        />
      )}

      {agendarOpen && (
        <AgendarModal
          onClose={() => setAgendarOpen(false)}
          onCreated={(nuevas) => {
            applyCitas(nuevas);
            setAgendarOpen(false);
            jumpToCita(nuevas[0]);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3,3,40,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 60,
      }}
    >
      <div
        style={{
          ...glass,
          background: "rgba(12,10,48,0.94)",
          width: maxWidth ?? "min(560px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: "22px 24px",
          color: "rgba(255,255,255,0.96)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
          {subtitle && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
      <span style={{ textAlign: "right", fontWeight: 500 }}>{v}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI detail — read only
// ---------------------------------------------------------------------------

const kpiTh: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#0c0a30",
  zIndex: 1,
  textAlign: "left",
  fontSize: 10.5,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  fontWeight: 600,
  padding: "8px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
};

const kpiTd: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  verticalAlign: "top",
  fontSize: 13,
};

function textoFila(row: KpiRow): string {
  const citas = [row.escritura, row.llaves].filter((c): c is EntregaCitaFull => c !== null);
  const titulares = (row.anchor.titulares ?? []).map((t) => t.full_name);
  return [
    row.anchor.unit_number,
    row.anchor.unit_code,
    row.anchor.tower_name,
    row.anchor.cliente,
    row.anchor.cliente_phone,
    row.anchor.banco,
    row.anchor.tipo_pago ? TIPO_PAGO_LABELS[row.anchor.tipo_pago] : null,
    row.atencion,
    ...titulares,
    ...citas.flatMap((c) => [
      MILESTONE_LABELS[c.milestone],
      MILESTONE_SHORT[c.milestone],
      ESTADO_LABELS[c.estado],
      fmtFechaCorta(c.fecha),
      fmtHora(c.hora),
      c.fecha,
      c.cancelada_motivo,
    ]),
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();
}

function etiquetaConteo(visible: number, total: number): string {
  if (visible === total) return total === 1 ? "1 fila" : `${total} filas`;
  return `${visible} de ${total}`;
}

function UnidadCell({ cita }: { cita: EntregaCitaFull }) {
  const code = cita.unit_code && cita.unit_code !== cita.unit_number ? cita.unit_code : null;
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Apto. {cita.unit_number}</span>
      {cita.tower_name && (
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>{cita.tower_name}</span>
      )}
      {code && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{code}</span>}
    </div>
  );
}

function CompradorCell({ cita }: { cita: EntregaCitaFull }) {
  const titulares = cita.titulares ?? [];
  const nombre =
    titulares.find((t) => t.is_primary)?.full_name ?? cita.cliente ?? "Sin titular registrado";
  const otros = titulares.filter((t) => !t.is_primary).map((t) => t.full_name);
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ fontWeight: 600 }}>{nombre}</span>
      {otros.length > 0 && (
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", lineHeight: 1.35 }}>
          Copropietarios: {otros.join(" · ")}
        </span>
      )}
      {cita.cliente_phone && (
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)" }}>{cita.cliente_phone}</span>
      )}
    </div>
  );
}

function PagoCell({ cita }: { cita: EntregaCitaFull }) {
  if (!cita.tipo_pago && !cita.banco) {
    return <span style={{ color: "rgba(255,255,255,0.38)" }}>Sin registrar</span>;
  }
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span>{cita.tipo_pago ? TIPO_PAGO_LABELS[cita.tipo_pago] : "Sin tipo de pago"}</span>
      {cita.banco && (
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>{cita.banco}</span>
      )}
    </div>
  );
}

function EventoCell({
  cita,
  counted,
  inFilter,
  canPublish,
}: {
  cita: EntregaCitaFull | null;
  counted: boolean;
  inFilter: boolean;
  canPublish: boolean;
}) {
  if (!cita) {
    return <span style={{ color: "rgba(255,255,255,0.38)" }}>Sin agendar</span>;
  }
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        justifyItems: "start",
        padding: counted ? "6px 8px" : "2px 0",
        borderRadius: 10,
        background: counted ? "rgba(4,176,214,0.12)" : "transparent",
        boxShadow: counted ? "inset 0 0 0 1px rgba(4,176,214,0.40)" : "none",
      }}
    >
      <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmtFechaCorta(cita.fecha)}</span>
      <span style={{ color: "#04b0d6", fontWeight: 700, fontSize: 12 }}>{fmtHora(cita.hora)}</span>
      <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <EstadoChip estado={cita.estado} />
        {cita.reprogramaciones > 0 && <ReprogramadaChip veces={cita.reprogramaciones} />}
        {canPublish && cita.publicada === false && <BorradorChip />}
      </span>
      {!inFilter && (
        <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.40)" }}>Fuera del filtro</span>
      )}
    </div>
  );
}

function KpiModal({
  kpi,
  rows,
  filteredIds,
  filters,
  canPublish,
  onClose,
}: {
  kpi: KpiId;
  rows: KpiRow[];
  filteredIds: ReadonlySet<string>;
  filters: Filters;
  canPublish: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const meta = KPI_DETALLE[kpi];
  const filtrosActivos =
    filters.q.trim() !== "" || filters.milestone !== "" || filters.estado !== "";
  const consulta = q.trim().toLowerCase();
  const visible = consulta === "" ? rows : rows.filter((row) => textoFila(row).includes(consulta));
  const completadasVaciasPorFiltro =
    kpi === "completadas" &&
    rows.length === 0 &&
    (filters.milestone !== "" || (filters.estado !== "" && filters.estado !== "COMPLETADA"));

  return (
    <ModalShell
      title={meta.titulo}
      subtitle={
        meta.detalle +
        (filtrosActivos ? " El número y estas filas respetan los filtros del cronograma." : "")
      }
      maxWidth="min(1120px, 100%)"
      onClose={onClose}
    >
      <style>{`.entrega-kpi-row:hover { background: rgba(255,255,255,0.045); }`}</style>

      {completadasVaciasPorFiltro && (
        <p style={{ fontSize: 12.5, color: "#ffd79a", lineHeight: 1.5, margin: "0 0 12px" }}>
          Esta tarjeta cuenta una unidad solo cuando la escrituración y la entrega de llaves están
          completadas. El filtro actual quita uno de los dos hitos, y la cuenta queda en cero.
        </p>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {rows.length > 0 && (
          <input
            type="search"
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar apartamento, comprador, banco…"
            aria-label="Buscar dentro de estas filas"
            style={{ ...inputStyle, flex: "1 1 220px", width: "auto" }}
          />
        )}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
          {etiquetaConteo(visible.length, rows.length)}
        </span>
        {rows.length > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              color: "rgba(255,255,255,0.48)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: "rgba(4,176,214,0.12)",
                boxShadow: "inset 0 0 0 1px rgba(4,176,214,0.40)",
              }}
            />
            Suma en la tarjeta
          </span>
        )}
        <button
          type="button"
          style={{ ...buttonStyle("ghost"), marginLeft: "auto" }}
          onClick={onClose}
          autoFocus={rows.length === 0}
        >
          Cerrar
        </button>
      </div>

      <div style={{ overflow: "auto", maxHeight: "max(180px, min(560px, calc(88vh - 220px)))", marginTop: 12 }}>
        {visible.length === 0 ? (
          completadasVaciasPorFiltro ? null : (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "8px 0 0" }}>
              {rows.length === 0
                ? "Ninguna fila con los filtros actuales."
                : "Ninguna fila coincide con la búsqueda."}
            </p>
          )
        ) : (
          <table
            aria-label={meta.titulo}
            style={{ width: "100%", borderCollapse: "collapse", minWidth: kpi === "atencion" ? 980 : 820 }}
          >
            <thead>
              <tr>
                <th style={kpiTh} scope="col">Apartamento</th>
                <th style={kpiTh} scope="col">Comprador</th>
                <th style={kpiTh} scope="col">Escrituración</th>
                <th style={kpiTh} scope="col">Entrega de llaves</th>
                <th style={kpiTh} scope="col">Pago</th>
                {kpi === "atencion" && (
                  <th style={kpiTh} scope="col">Atención</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.key} className="entrega-kpi-row">
                  <td style={kpiTd}>
                    <UnidadCell cita={row.anchor} />
                  </td>
                  <td style={kpiTd}>
                    <CompradorCell cita={row.anchor} />
                  </td>
                  <td style={kpiTd}>
                    <EventoCell
                      cita={row.escritura}
                      counted={row.escritura !== null && row.countedIds.has(row.escritura.cita_id)}
                      inFilter={row.escritura !== null && filteredIds.has(row.escritura.cita_id)}
                      canPublish={canPublish}
                    />
                  </td>
                  <td style={kpiTd}>
                    <EventoCell
                      cita={row.llaves}
                      counted={row.llaves !== null && row.countedIds.has(row.llaves.cita_id)}
                      inFilter={row.llaves !== null && filteredIds.has(row.llaves.cita_id)}
                      canPublish={canPublish}
                    />
                  </td>
                  <td style={kpiTd}>
                    <PagoCell cita={row.anchor} />
                  </td>
                  {kpi === "atencion" && (
                    <td style={{ ...kpiTd, maxWidth: 240, lineHeight: 1.4 }}>
                      {row.atencion}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Detail + edit
// ---------------------------------------------------------------------------

function DetalleModal({
  citas,
  canEdit,
  canPublish,
  onClose,
  onSaved,
  onPublish,
  onDeleted,
  onRenamed,
}: {
  /** The visit: one cita, or the two hitos sharing the slot. Ordered escritura → llaves. */
  citas: EntregaCitaFull[];
  canEdit: boolean;
  canPublish: boolean;
  onClose: () => void;
  onSaved: (citas: EntregaCitaFull[]) => void;
  /** Publishes every unpublished cita of this visit. Does not change estado. */
  onPublish: (citas: EntregaCitaFull[]) => Promise<void>;
  onDeleted: (citaId: string) => void;
  /** A renamed titular reaches every cita that names them, not just this visit. */
  onRenamed: (cambios: { client_id: string; full_name: string }[]) => void;
}) {
  // Every cita of a group shares fecha, hora, apartamento and expediente, so the
  // first one speaks for the visit.
  const principal = citas[0];
  const combinada = citas.length > 1;

  const [editing, setEditing] = useState(false);
  const [fecha, setFecha] = useState(principal.fecha);
  const [hora, setHora] = useState(toInputTime(principal.hora));
  /** Which hitos the new date and hour reach — the whole visit unless split. */
  const [alcance, setAlcance] = useState<"TODOS" | EntregaMilestone>("TODOS");
  /**
   * Whether moving the visit counts against the client. Reschedules the sales
   * department originates are operational noise and must not inflate the
   * counter; the ones the client asks for are exactly what it tracks. Defaults
   * to counting, so a move is never silently dropped from the record.
   */
  const [cuentaReprogramacion, setCuentaReprogramacion] = useState(true);
  const [estados, setEstados] = useState<Record<string, EntregaEstado>>(() =>
    porCita(citas, (c) => c.estado),
  );
  const [motivos, setMotivos] = useState<Record<string, string>>(() =>
    porCita(citas, (c) => c.cancelada_motivo ?? ""),
  );
  const [notas, setNotas] = useState<Record<string, string>>(() =>
    porCita(citas, (c) => c.cita_notas ?? ""),
  );
  const [tipoPago, setTipoPago] = useState<"" | EntregaTipoPago>(principal.tipo_pago ?? "");
  const [banco, setBanco] = useState(principal.banco ?? "");
  /**
   * Titular names, keyed by rv_clients.id. Spelling fixes only — the errors are
   * accents and transposed letters, not structure. Includes copropietarios,
   * which the read view does not list but which carry the same typos.
   */
  const [nombres, setNombres] = useState<Record<string, string>>(() =>
    Object.fromEntries((principal.titulares ?? []).map((t) => [t.client_id, t.full_name])),
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const moved = fecha !== principal.fecha || hora !== toInputTime(principal.hora);

  function enAlcance(cita: EntregaCitaFull): boolean {
    return alcance === "TODOS" || cita.milestone === alcance;
  }

  async function save() {
    for (const c of citas) {
      if (estados[c.cita_id] === "CANCELADA" && (motivos[c.cita_id] ?? "").trim() === "") {
        setErr(`Cancelar la ${MILESTONE_LABELS[c.milestone].toLowerCase()} requiere un motivo.`);
        return;
      }
    }

    if (citas.some((c) => enAlcance(c) && fecha !== c.fecha) && !isDiaHabil(fecha)) {
      setErr(DIA_NO_HABIL_MENSAJE);
      return;
    }

    const titulares = principal.titulares ?? [];
    const renombrados = titulares.filter(
      (t) => (nombres[t.client_id] ?? "").trim() !== t.full_name,
    );
    for (const t of renombrados) {
      if ((nombres[t.client_id] ?? "").trim() === "") {
        setErr("El nombre del titular no puede quedar vacío.");
        return;
      }
    }

    setSaving(true);
    setErr(null);

    const nuevoTipo = tipoPago === "" ? null : tipoPago;
    const nuevoBanco = banco.trim() === "" ? null : banco.trim();
    // Tipo de pago and banco belong to the expediente, so a change touches both
    // hitos. Sending them on every cita keeps the board rows in step with the DB
    // instead of leaving the untouched hito showing the old bank.
    const expedienteCambio =
      nuevoTipo !== principal.tipo_pago || nuevoBanco !== principal.banco;

    const guardadas: EntregaCitaFull[] = [];

    try {
      // Titulares first, and in their own requests: the name lives in
      // rv_clients, the visit in entrega_citas. Keeping them separate means a
      // spelling fix never touches the cita — and never trips the
      // reprogramaciones counter.
      if (renombrados.length > 0) {
        const aplicados: { client_id: string; full_name: string }[] = [];
        try {
          for (const t of renombrados) {
            const nuevo = nombres[t.client_id].trim();
            const res = await fetch(`/api/reservas/admin/clients/${t.client_id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ full_name: nuevo }),
            });
            const body = await res.json();
            if (!res.ok) {
              throw new Error(`${t.full_name}: ${body?.error ?? `Error ${res.status}`}`);
            }
            aplicados.push({ client_id: t.client_id, full_name: body.full_name as string });
          }
        } finally {
          // Whatever landed is pushed to the board even if a later name failed,
          // so the screen never shows a name the DB no longer holds.
          if (aplicados.length > 0) onRenamed(aplicados);
        }
      }

      for (const c of citas) {
        const payload: Record<string, unknown> = {};

        if (enAlcance(c) && (fecha !== c.fecha || hora !== toInputTime(c.hora))) {
          payload.fecha = fecha;
          payload.hora = hora;
          payload.cuenta_reprogramacion = cuentaReprogramacion;
        }

        const estado = estados[c.cita_id];
        if (estado !== c.estado) payload.estado = estado;
        if (estado === "CANCELADA") payload.cancelada_motivo = motivos[c.cita_id].trim();

        const nota = notas[c.cita_id].trim() === "" ? null : notas[c.cita_id].trim();
        if (nota !== c.cita_notas) payload.notas = nota;

        if (expedienteCambio) {
          payload.tipo_pago = nuevoTipo;
          payload.banco = nuevoBanco;
        }

        if (Object.keys(payload).length === 0) continue;

        const res = await fetch(`/api/entregas/citas/${c.cita_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(
            `${MILESTONE_LABELS[c.milestone]}: ${body?.error ?? `Error ${res.status}`}`,
          );
        }
        guardadas.push(body.cita as EntregaCitaFull);
      }

      onSaved(guardadas);
      setEditing(false);
    } catch (e) {
      // Whatever landed is applied to the board; the message names what did not,
      // so a half-applied edit is never reported as a clean failure.
      onSaved(guardadas);
      setErr(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setErr(null);
    try {
      await onPublish(citas);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo publicar");
    } finally {
      setPublishing(false);
    }
  }

  async function remove(cita: EntregaCitaFull) {
    if (
      !window.confirm(
        `Eliminar la ${MILESTONE_LABELS[cita.milestone].toLowerCase()} del apartamento ${cita.unit_number}? Esta acción no se puede deshacer. Para dejar constancia, use Cancelada en su lugar.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/entregas/citas/${cita.cita_id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
      onDeleted(cita.cita_id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  }

  function resetEdits() {
    setEditing(false);
    setErr(null);
    setFecha(principal.fecha);
    setHora(toInputTime(principal.hora));
    setAlcance("TODOS");
    setCuentaReprogramacion(true);
    setEstados(porCita(citas, (c) => c.estado));
    setMotivos(porCita(citas, (c) => c.cancelada_motivo ?? ""));
    setNotas(porCita(citas, (c) => c.cita_notas ?? ""));
    setTipoPago(principal.tipo_pago ?? "");
    setBanco(principal.banco ?? "");
    setNombres(
      Object.fromEntries((principal.titulares ?? []).map((t) => [t.client_id, t.full_name])),
    );
  }

  const bloqueHito: React.CSSProperties = combinada
    ? {
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
      }
    : {};

  return (
    <ModalShell
      title={principal.cliente ?? "Sin titular registrado"}
      subtitle={`Apartamento ${principal.unit_number}${principal.tower_name ? ` · ${principal.tower_name}` : ""} · ${hitosLabel(citas)}`}
      onClose={onClose}
    >
      {!editing ? (
        <>
          {combinada && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.62)",
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              Los dos hitos ocurren en la misma visita. Cada uno se confirma, completa o cancela
              por separado.
            </div>
          )}

          <Row k="Fecha" v={fmtFechaLarga(principal.fecha)} />
          <Row k="Hora" v={fmtHora(principal.hora)} />
          <Row
            k="Tipo de pago"
            v={principal.tipo_pago ? TIPO_PAGO_LABELS[principal.tipo_pago] : "Sin registrar"}
          />
          <Row k="Banco" v={principal.banco ?? "Sin registrar"} />
          <Row
            k="Titulares"
            v={principal.titulares_count > 1 ? `${principal.titulares_count} copropietarios` : "1"}
          />
          <Row k="Teléfono" v={principal.cliente_phone ?? "Sin registrar"} />

          {citas.map((c) => (
            <div key={c.cita_id} style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <MilestoneChip milestone={c.milestone} />
                <EstadoChip estado={c.estado} />
                {c.reprogramaciones > 0 && <ReprogramadaChip veces={c.reprogramaciones} />}
              </div>
              {c.completada_at && (
                <Row
                  k="Completada"
                  v={new Date(c.completada_at).toLocaleString("es-GT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
              )}
              {c.cancelada_motivo && <Row k="Motivo de cancelación" v={c.cancelada_motivo} />}
              <Row k="Notas" v={c.cita_notas ?? "Sin notas"} />
            </div>
          ))}

          {canPublish && esBorrador(citas) && (
            <p style={{ fontSize: 12.5, color: "#ffd79a", margin: "14px 0 0", lineHeight: 1.5 }}>
              Borrador. Quien consulta el tablero no ve esta visita hasta que se publique.
            </p>
          )}

          {err && (
            <div role="alert" style={{ fontSize: 12.5, color: "#ff8095", marginTop: 12 }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 9, marginTop: 18, flexWrap: "wrap" }}>
            {canPublish && esBorrador(citas) && (
              <button
                type="button"
                style={buttonStyle("primary")}
                onClick={() => void publish()}
                disabled={publishing || saving}
              >
                {publishing ? "Publicando…" : "Publicar"}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                style={buttonStyle("primary")}
                onClick={() => setEditing(true)}
                disabled={publishing || saving}
              >
                Editar
              </button>
            )}
            {canEdit &&
              citas.map((c) => (
                <button
                  key={c.cita_id}
                  type="button"
                  style={buttonStyle("danger")}
                  onClick={() => void remove(c)}
                  disabled={publishing || saving}
                >
                  {combinada ? `Eliminar ${MILESTONE_SHORT[c.milestone].toLowerCase()}` : "Eliminar"}
                </button>
              ))}
            <button
              type="button"
              style={{ ...buttonStyle("ghost"), marginLeft: "auto" }}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gap: 13 }}>
          {(principal.titulares ?? []).length > 0 && (
            <div style={{ display: "grid", gap: 9 }}>
              {(principal.titulares ?? []).map((t) => (
                <div key={t.client_id}>
                  <label style={labelStyle} htmlFor={`edit-titular-${t.client_id}`}>
                    {t.is_primary ? "Titular" : "Copropietario"}
                  </label>
                  <input
                    id={`edit-titular-${t.client_id}`}
                    type="text"
                    value={nombres[t.client_id] ?? ""}
                    onChange={(e) =>
                      setNombres((prev) => ({ ...prev, [t.client_id]: e.target.value }))
                    }
                    style={inputStyle}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              ))}
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                Corrige la ortografía. El nombre cambia en todo el sistema —
                reservas, comisiones y créditos — no solo en el cronograma.
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="edit-fecha">
                Fecha
              </label>
              <input
                id="edit-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="edit-hora">
                Hora
              </label>
              <input
                id="edit-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {combinada && (
            <div>
              <label style={labelStyle} htmlFor="edit-alcance">
                Aplicar fecha y hora a
              </label>
              <select
                className="dark-select"
                id="edit-alcance"
                value={alcance}
                onChange={(e) => setAlcance(e.target.value as "TODOS" | EntregaMilestone)}
                style={inputStyle}
              >
                <option value="TODOS">Ambos hitos</option>
                {citas.map((c) => (
                  <option key={c.cita_id} value={c.milestone}>
                    Solo {MILESTONE_LABELS[c.milestone].toLowerCase()}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 5 }}>
                Separe los hitos cuando solo uno cambie de fecha: el otro se queda donde está.
              </div>
            </div>
          )}

          {moved && (
            <div style={{ display: "grid", gap: 6 }}>
              <label
                htmlFor="edit-cuenta-reprogramacion"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#ffd79a",
                  cursor: "pointer",
                }}
              >
                <input
                  id="edit-cuenta-reprogramacion"
                  type="checkbox"
                  checked={cuentaReprogramacion}
                  onChange={(e) => setCuentaReprogramacion(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#ffd79a", cursor: "pointer" }}
                />
                ¿Cuenta como Reprogramada?
              </label>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                Márquela si el cliente pidió mover la cita. Desmárquela si el cambio lo originó
                el departamento de ventas: la cita se mueve igual, pero no suma al contador de
                reprogramaciones.
              </div>
              {citas.some((c) => enAlcance(c) && c.estado === "CONFIRMADA") && (
                <div style={{ fontSize: 11.5, color: "#ffd79a" }}>
                  Mover{" "}
                  {alcance === "TODOS"
                    ? combinada
                      ? "ambos hitos"
                      : "la cita"
                    : `solo la ${MILESTONE_LABELS[alcance].toLowerCase()}`}{" "}
                  anula la confirmación anterior.
                </div>
              )}
            </div>
          )}

          {citas.map((c) => (
            <div key={c.cita_id} style={{ display: "grid", gap: 11, ...bloqueHito }}>
              {combinada && (
                <div>
                  <MilestoneChip milestone={c.milestone} />
                </div>
              )}

              <div>
                <label style={labelStyle} htmlFor={`edit-estado-${c.cita_id}`}>
                  Estado
                </label>
                <select
                  className="dark-select"
                  id={`edit-estado-${c.cita_id}`}
                  value={estados[c.cita_id]}
                  onChange={(e) =>
                    setEstados((prev) => ({
                      ...prev,
                      [c.cita_id]: e.target.value as EntregaEstado,
                    }))
                  }
                  style={inputStyle}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_LABELS[e]}
                    </option>
                  ))}
                </select>
              </div>

              {estados[c.cita_id] === "CANCELADA" && (
                <div>
                  <label style={labelStyle} htmlFor={`edit-motivo-${c.cita_id}`}>
                    Motivo de cancelación
                  </label>
                  <input
                    id={`edit-motivo-${c.cita_id}`}
                    type="text"
                    value={motivos[c.cita_id]}
                    onChange={(e) =>
                      setMotivos((prev) => ({ ...prev, [c.cita_id]: e.target.value }))
                    }
                    placeholder="Por qué se canceló"
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle} htmlFor={`edit-notas-${c.cita_id}`}>
                  Notas
                </label>
                <textarea
                  id={`edit-notas-${c.cita_id}`}
                  value={notas[c.cita_id]}
                  onChange={(e) => setNotas((prev) => ({ ...prev, [c.cita_id]: e.target.value }))}
                  rows={combinada ? 2 : 3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="edit-tipo">
                Tipo de pago
              </label>
              <select
                className="dark-select"
                id="edit-tipo"
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value as "" | EntregaTipoPago)}
                style={inputStyle}
              >
                <option value="">Sin registrar</option>
                {TIPOS_PAGO.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_PAGO_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="edit-banco">
                Banco
              </label>
              <input
                id="edit-banco"
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                placeholder="Sin registrar"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: -6 }}>
            Tipo de pago y banco pertenecen al apartamento: el cambio aplica también al otro hito.
          </div>

          {err && (
            <div role="alert" style={{ fontSize: 12.5, color: "#ff8095" }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
            <button
              type="button"
              style={buttonStyle("primary")}
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              style={buttonStyle("ghost")}
              onClick={resetEdits}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Schedule a new cita
// ---------------------------------------------------------------------------

function AgendarModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (citas: EntregaCitaFull[]) => void;
}) {
  const [candidatos, setCandidatos] = useState<EntregaCandidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<EntregaCandidato | null>(null);
  /** One hito, or both when the client signs and receives the keys in one visit. */
  const [milestones, setMilestones] = useState<EntregaMilestone[]>(["ESCRITURA"]);
  const [fecha, setFecha] = useState(isoOf(new Date()));
  const [hora, setHora] = useState<string>(HORAS_SUGERIDAS[0]);
  const [tipoPago, setTipoPago] = useState<"" | EntregaTipoPago>("");
  const [banco, setBanco] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/entregas/candidatos", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
        if (!cancelled) setCandidatos(body.candidatos as EntregaCandidato[]);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "No se pudieron cargar las unidades");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Every pending unit, never truncated — the list scrolls instead. */
  const pendientes = useMemo(
    () => candidatos.filter((c) => c.citas_agendadas.length < MILESTONES.length),
    [candidatos],
  );

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return pendientes;
    return pendientes.filter((c) =>
      `${c.unit_number} ${c.unit_code ?? ""} ${c.cliente ?? ""}`.toLowerCase().includes(needle),
    );
  }, [pendientes, q]);

  /** What the unit already has booked, so the toggle can say so instead of hiding it. */
  const agendadoPorHito = useMemo(() => {
    const map = new Map<EntregaMilestone, string>();
    for (const cita of selected?.citas_agendadas ?? []) map.set(cita.milestone, cita.fecha);
    return map;
  }, [selected]);

  const pick = useCallback((candidato: EntregaCandidato) => {
    setSelected(candidato);
    const yaAgendados = candidato.citas_agendadas.map((c) => c.milestone);
    const disponibles = MILESTONES.filter((m) => !yaAgendados.includes(m));
    // Preselect one hito only: scheduling both in one visit is the exception and
    // must be a deliberate second click.
    setMilestones(disponibles.slice(0, 1));
    // Existing expediente values win; the snapshot only fills the gaps.
    setTipoPago(candidato.tipo_pago ?? candidato.sugerencia?.tipo_pago ?? "");
    setBanco(candidato.banco ?? candidato.sugerencia?.banco ?? "");
  }, []);

  const toggleMilestone = useCallback((milestone: EntregaMilestone) => {
    setMilestones((prev) =>
      prev.includes(milestone)
        ? prev.filter((m) => m !== milestone)
        : MILESTONES.filter((m) => m === milestone || prev.includes(m)),
    );
  }, []);

  async function submit() {
    if (!selected || milestones.length === 0) return;
    if (!isDiaHabil(fecha)) {
      setErr(DIA_NO_HABIL_MENSAJE);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: selected.unit_id,
          milestones,
          fecha,
          hora,
          tipo_pago: tipoPago === "" ? null : tipoPago,
          banco: banco.trim() === "" ? null : banco.trim(),
          notas: notas.trim() === "" ? null : notas.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
      onCreated(body.citas as EntregaCitaFull[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo agendar");
      setSaving(false);
    }
  }

  const usandoSugerencia =
    selected !== null &&
    selected.tipo_pago === null &&
    selected.banco === null &&
    selected.sugerencia !== null;

  return (
    <ModalShell
      title="Agendar cita"
      subtitle="Solo unidades vendidas con reserva confirmada de Boulevard 5"
      onClose={onClose}
    >
      {!selected ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="buscar-unidad">
              Apartamento o cliente
            </label>
            <input
              id="buscar-unidad"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. 306 o el nombre del titular"
              style={inputStyle}
              autoFocus
            />
          </div>

          {loading && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>Cargando unidades…</div>
          )}
          {err && (
            <div role="alert" style={{ fontSize: 12.5, color: "#ff8095" }}>
              {err}
            </div>
          )}

          {!loading && !err && matches.length === 0 && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
              {q.trim()
                ? "Ninguna unidad pendiente coincide con la búsqueda."
                : "Todas las unidades vendidas ya tienen sus dos hitos agendados."}
            </div>
          )}

          {!loading && !err && matches.length > 0 && (
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)" }}>
              {q.trim()
                ? `${matches.length} de ${pendientes.length} unidades pendientes`
                : `${pendientes.length} unidades pendientes`}
            </div>
          )}

          <div style={{ display: "grid", gap: 7, maxHeight: 340, overflowY: "auto" }}>
            {matches.map((c) => (
              <button
                key={c.unit_id}
                type="button"
                onClick={() => pick(c)}
                style={{
                  textAlign: "left",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "10px 13px",
                  cursor: "pointer",
                  color: "inherit",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Apto. {c.unit_number}
                  {c.tower_name ? ` · ${c.tower_name}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {c.cliente ?? "Sin titular registrado"}
                </div>
                {c.citas_agendadas.length > 0 && (
                  <div style={{ fontSize: 11, color: "#ffd79a", marginTop: 4 }}>
                    Ya agendado:{" "}
                    {c.citas_agendadas
                      .map(
                        (a) =>
                          `${MILESTONE_SHORT[a.milestone]} ${fmtDayMonth(parseLocalDate(a.fecha))}`,
                      )
                      .join(" · ")}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 13 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "11px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Apto. {selected.unit_number}
                {selected.tower_name ? ` · ${selected.tower_name}` : ""}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                {selected.cliente ?? "Sin titular registrado"}
              </div>
            </div>
            <button
              type="button"
              style={{ ...buttonStyle("ghost"), padding: "6px 13px" }}
              onClick={() => setSelected(null)}
            >
              Cambiar
            </button>
          </div>

          <div>
            <span style={labelStyle} id="agendar-hitos-label">
              Hitos de esta cita
            </span>
            <div
              role="group"
              aria-labelledby="agendar-hitos-label"
              style={{ display: "flex", gap: 9, flexWrap: "wrap" }}
            >
              {MILESTONES.map((m) => {
                const agendadaEl = agendadoPorHito.get(m) ?? null;
                const activo = milestones.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    role="checkbox"
                    aria-checked={activo}
                    disabled={agendadaEl !== null}
                    onClick={() => toggleMilestone(m)}
                    style={{
                      flex: "1 1 180px",
                      textAlign: "left",
                      borderRadius: 12,
                      padding: "11px 14px",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: agendadaEl ? "not-allowed" : "pointer",
                      color: agendadaEl
                        ? "rgba(255,255,255,0.40)"
                        : activo
                          ? "#04b0d6"
                          : "rgba(255,255,255,0.82)",
                      background: activo ? "rgba(4,176,214,0.14)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${activo ? "rgba(4,176,214,0.55)" : "rgba(255,255,255,0.16)"}`,
                      opacity: agendadaEl ? 0.7 : 1,
                    }}
                  >
                    <span aria-hidden style={{ marginRight: 7 }}>
                      {activo ? "✓" : "○"}
                    </span>
                    {MILESTONE_LABELS[m]}
                    {agendadaEl && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#ffd79a",
                          marginTop: 3,
                        }}
                      >
                        Ya agendada · {fmtDayMonth(parseLocalDate(agendadaEl))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {milestones.length > 1 && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 7,
                  lineHeight: 1.5,
                }}
              >
                Los dos hitos quedan en la misma visita, con la misma fecha y hora, y ocupan un
                solo cupo del día. Cada uno se confirma, completa o cancela por separado.
              </div>
            )}
            {milestones.length === 0 && (
              <div style={{ fontSize: 11.5, color: "#ffd79a", marginTop: 7 }}>
                Seleccione al menos un hito.
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="agendar-fecha">
                Fecha
              </label>
              <input
                id="agendar-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="agendar-hora">
                Hora
              </label>
              <input
                id="agendar-hora"
                type="time"
                list="horas-sugeridas"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={inputStyle}
              />
              <datalist id="horas-sugeridas">
                {HORAS_SUGERIDAS.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="agendar-tipo">
                Tipo de pago
              </label>
              <select
                className="dark-select"
                id="agendar-tipo"
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value as "" | EntregaTipoPago)}
                style={inputStyle}
              >
                <option value="">Sin registrar</option>
                {TIPOS_PAGO.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_PAGO_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="agendar-banco">
                Banco
              </label>
              <input
                id="agendar-banco"
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                placeholder="Sin registrar"
                style={inputStyle}
              />
            </div>
          </div>

          {usandoSugerencia && (
            <div style={{ fontSize: 11, color: "#ffd79a", marginTop: -6 }}>
              Tipo de pago y banco sugeridos desde el snapshot de créditos (corte 5 ago 2026).
              Verifíquelos antes de guardar.
            </div>
          )}

          <div>
            <label style={labelStyle} htmlFor="agendar-notas">
              Notas
            </label>
            <textarea
              id="agendar-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {err && (
            <div role="alert" style={{ fontSize: 12.5, color: "#ff8095" }}>
              {err}
            </div>
          )}

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
            La cita queda en borrador. Quien consulta el tablero la ve cuando se publica la visita.
          </p>

          <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
            <button
              type="button"
              style={buttonStyle("primary")}
              onClick={() => void submit()}
              disabled={saving || milestones.length === 0}
            >
              {saving ? "Agendando…" : "Agendar"}
            </button>
            <button type="button" style={buttonStyle("ghost")} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
