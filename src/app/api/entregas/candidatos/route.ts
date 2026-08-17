import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";
import dealsSnapshot from "@/lib/creditos/deals-snapshot.json";
import { ENTREGAS_PROJECT_SLUG } from "@/lib/entregas/constants";
import type {
  EntregaCandidato,
  EntregaMilestone,
  EntregaTipoPago,
} from "@/lib/entregas/types";

type SnapshotDeal = {
  embudo: string;
  estado: string;
  apartamento: string | null;
  tipoCredito: string;
  banco: string | null;
};

/** Pipedrive funnel that corresponds to the project this board serves. */
const EMBUDO = "Créditos BLV5";

const TIPO_CREDITO_MAP: Record<string, EntregaTipoPago> = {
  FHA: "FHA",
  "Crédito Directo": "CREDITO_DIRECTO",
  Contado: "CONTADO",
};

/**
 * Suggestions from the Pipedrive créditos snapshot, keyed by apartment number.
 *
 * The snapshot is a frozen export (boundary 2026-08-05) and is dirty: of 569
 * B5 deals only 347 carry an apartment and 213 a bank, and `tipoCredito` is
 * "Sin dato" for 273. A suggestion is therefore emitted ONLY when exactly one
 * open deal matches the apartment — ambiguous or lost-only matches produce
 * nothing rather than a plausible guess. Torre de Control always confirms.
 */
function buildSuggestions(): Map<string, { tipo_pago: EntregaTipoPago | null; banco: string | null }> {
  const byApartment = new Map<string, SnapshotDeal[]>();

  for (const deal of (dealsSnapshot as { deals: SnapshotDeal[] }).deals) {
    if (deal.embudo !== EMBUDO) continue;
    if (deal.estado !== "open") continue;
    const apto = (deal.apartamento ?? "").trim();
    if (!apto) continue;
    const bucket = byApartment.get(apto);
    if (bucket) bucket.push(deal);
    else byApartment.set(apto, [deal]);
  }

  const suggestions = new Map<string, { tipo_pago: EntregaTipoPago | null; banco: string | null }>();
  for (const [apto, deals] of byApartment) {
    if (deals.length !== 1) continue; // ambiguous — no suggestion
    const deal = deals[0];
    const tipo = TIPO_CREDITO_MAP[deal.tipoCredito] ?? null;
    const banco = (deal.banco ?? "").trim() || null;
    if (tipo === null && banco === null) continue;
    suggestions.set(apto, { tipo_pago: tipo, banco });
  }
  return suggestions;
}

/**
 * `rv_units.unit_number` is text, so Postgres orders it lexicographically and
 * interleaves the floors: 1001, 1002, … 1009, 101, 1010, 102, 103. Natural
 * ordering is applied here so the picker reads like a building.
 */
function compareUnitNumber(a: string, b: string): number {
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

/**
 * GET /api/entregas/candidatos
 *
 * Units that can receive an entrega: SOLD, with a CONFIRMED reservation.
 * Each carries the milestones already scheduled so the UI can offer only what
 * is still missing, plus a non-authoritative suggestion from the créditos
 * snapshot.
 *
 * Auth: admins only — this is the scheduling picker, and it exposes the full
 * sold-unit roster with client names.
 */
export async function GET() {
  const auth = await requireRole(rolesFor("entregas", "create"));
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data: units, error: unitsErr } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, unit_code, tower_name, project_id")
    .eq("project_slug", ENTREGAS_PROJECT_SLUG)
    .eq("status", "SOLD")
    .order("unit_number");

  if (unitsErr) {
    console.error("[GET /api/entregas/candidatos] units", unitsErr);
    return jsonError(500, unitsErr.message);
  }

  const unitIds = (units ?? []).map((u) => u.id);
  if (unitIds.length === 0) return jsonOk({ candidatos: [] });

  const [reservationsRes, entregasRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, unit_id")
      .in("unit_id", unitIds)
      .eq("status", "CONFIRMED"),
    supabase
      .from("entregas")
      .select("id, unit_id, tipo_pago, banco, entrega_citas(milestone)")
      .in("unit_id", unitIds),
  ]);

  if (reservationsRes.error) {
    console.error("[GET /api/entregas/candidatos] reservations", reservationsRes.error);
    return jsonError(500, reservationsRes.error.message);
  }
  if (entregasRes.error) {
    console.error("[GET /api/entregas/candidatos] entregas", entregasRes.error);
    return jsonError(500, entregasRes.error.message);
  }

  const reservationByUnit = new Map<string, string>();
  for (const r of reservationsRes.data ?? []) {
    reservationByUnit.set(r.unit_id, r.id);
  }

  type EntregaRow = {
    id: string;
    unit_id: string;
    tipo_pago: EntregaTipoPago | null;
    banco: string | null;
    entrega_citas: { milestone: EntregaMilestone }[] | null;
  };
  const entregaByUnit = new Map<string, EntregaRow>();
  for (const e of (entregasRes.data ?? []) as unknown as EntregaRow[]) {
    entregaByUnit.set(e.unit_id, e);
  }

  // Primary titular per reservation, resolved in one round trip.
  const reservationIds = [...reservationByUnit.values()];
  const clienteByReservation = new Map<string, string>();

  if (reservationIds.length > 0) {
    const { data: clients, error: clientsErr } = await supabase
      .from("reservation_clients")
      .select("reservation_id, rv_clients(full_name)")
      .in("reservation_id", reservationIds)
      .eq("is_primary", true);

    if (clientsErr) {
      console.error("[GET /api/entregas/candidatos] clients", clientsErr);
      return jsonError(500, clientsErr.message);
    }

    type ClientRow = {
      reservation_id: string;
      rv_clients: { full_name: string } | { full_name: string }[] | null;
    };
    for (const row of (clients ?? []) as unknown as ClientRow[]) {
      const client = Array.isArray(row.rv_clients) ? row.rv_clients[0] : row.rv_clients;
      if (client?.full_name) clienteByReservation.set(row.reservation_id, client.full_name);
    }
  }

  const suggestions = buildSuggestions();

  const candidatos: EntregaCandidato[] = [];
  for (const unit of units ?? []) {
    const reservationId = reservationByUnit.get(unit.id);
    // A sold unit without a confirmed reservation cannot be linked, so it is
    // not offered rather than silently scheduled against nothing.
    if (!reservationId) continue;

    const entrega = entregaByUnit.get(unit.id) ?? null;
    const milestones = (entrega?.entrega_citas ?? []).map((c) => c.milestone);

    candidatos.push({
      unit_id: unit.id,
      unit_number: unit.unit_number,
      unit_code: unit.unit_code,
      tower_name: unit.tower_name,
      project_id: unit.project_id,
      reservation_id: reservationId,
      cliente: clienteByReservation.get(reservationId) ?? null,
      entrega_id: entrega?.id ?? null,
      tipo_pago: entrega?.tipo_pago ?? null,
      banco: entrega?.banco ?? null,
      milestones_agendados: milestones,
      sugerencia: suggestions.get(unit.unit_number) ?? null,
    });
  }

  candidatos.sort((a, b) => compareUnitNumber(a.unit_number, b.unit_number));

  return jsonOk({ candidatos });
}
