import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson, parseQuery } from "@/lib/api";
import { agendarCitaSchema, entregasQuerySchema } from "@/lib/entregas/validations";
import { ENTREGAS_PROJECT_SLUG, MILESTONE_LABELS } from "@/lib/entregas/constants";
import type { EntregaCitaFull, EntregaMilestone } from "@/lib/entregas/types";

/**
 * GET /api/entregas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Returns every cita of the cronograma, newest state included. Date bounds are
 * optional — the board loads the full cronograma so week navigation is instant.
 *
 * Auth: data viewers + entregas_viewer.
 */
export async function GET(request: Request) {
  const auth = await requireRole(rolesFor("entregas", "view"));
  if (auth.response) return auth.response;

  const { data: query, error: qErr } = parseQuery(request, entregasQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();

  let builder = supabase
    .from("v_entregas_full")
    .select("*")
    .eq("project_slug", ENTREGAS_PROJECT_SLUG);

  if (query.desde) builder = builder.gte("fecha", query.desde);
  if (query.hasta) builder = builder.lte("fecha", query.hasta);

  const { data, error } = await builder
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) {
    console.error("[GET /api/entregas]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ citas: (data ?? []) as EntregaCitaFull[] });
}

/**
 * POST /api/entregas
 *
 * Schedules one milestone (ESCRITURA or LLAVES) for a unit. The expediente is
 * created on first use and reused for the second milestone, so tipo de pago and
 * banco are captured once per unit rather than once per cita.
 *
 * Auth: admins only.
 */
export async function POST(request: Request) {
  const auth = await requireRole(rolesFor("entregas", "create"));
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, agendarCitaSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();
  const milestone = input.milestone as EntregaMilestone;

  // ---- Resolve the unit and its confirmed reservation ---------------------
  // A unit that changed hands carries DESISTED reservations too; only the
  // CONFIRMED one may back an entrega.
  const { data: unit, error: unitErr } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, status, project_id, project_slug")
    .eq("id", input.unit_id)
    .maybeSingle();

  if (unitErr) {
    console.error("[POST /api/entregas] unit lookup", unitErr);
    return jsonError(500, unitErr.message);
  }
  if (!unit) return jsonError(404, "La unidad no existe");
  if (unit.status !== "SOLD") {
    return jsonError(
      409,
      `La unidad ${unit.unit_number} está en estado ${unit.status}. Solo se agendan entregas de unidades vendidas.`
    );
  }

  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .select("id")
    .eq("unit_id", input.unit_id)
    .eq("status", "CONFIRMED")
    .maybeSingle();

  if (resErr) {
    console.error("[POST /api/entregas] reservation lookup", resErr);
    return jsonError(500, resErr.message);
  }
  if (!reservation) {
    return jsonError(
      409,
      `La unidad ${unit.unit_number} no tiene una reserva confirmada. No se puede agendar su entrega.`
    );
  }

  // ---- Expediente: reuse if the other milestone is already scheduled ------
  const { data: existing, error: existingErr } = await supabase
    .from("entregas")
    .select("id, tipo_pago, banco")
    .eq("unit_id", input.unit_id)
    .maybeSingle();

  if (existingErr) {
    console.error("[POST /api/entregas] expediente lookup", existingErr);
    return jsonError(500, existingErr.message);
  }

  let entregaId: string;

  if (existing) {
    entregaId = existing.id;
    // Late-arriving tipo de pago / banco enrich the expediente; a value already
    // captured is never silently overwritten by a null.
    const patch: Record<string, unknown> = {};
    if (input.tipo_pago !== null && input.tipo_pago !== existing.tipo_pago) {
      patch.tipo_pago = input.tipo_pago;
    }
    if (input.banco !== null && input.banco !== existing.banco) {
      patch.banco = input.banco;
    }
    if (Object.keys(patch).length > 0) {
      patch.updated_by = auth.user!.id;
      const { error: patchErr } = await supabase
        .from("entregas")
        .update(patch)
        .eq("id", entregaId);
      if (patchErr) {
        console.error("[POST /api/entregas] expediente update", patchErr);
        return jsonError(500, patchErr.message);
      }
    }
  } else {
    const { data: created, error: createErr } = await supabase
      .from("entregas")
      .insert({
        project_id: unit.project_id,
        unit_id: input.unit_id,
        reservation_id: reservation.id,
        tipo_pago: input.tipo_pago,
        banco: input.banco,
        created_by: auth.user!.id,
        updated_by: auth.user!.id,
      })
      .select("id")
      .single();

    if (createErr) {
      console.error("[POST /api/entregas] expediente insert", createErr);
      return jsonError(500, createErr.message);
    }
    entregaId = created.id;
  }

  // ---- Cita ---------------------------------------------------------------
  const { data: cita, error: citaErr } = await supabase
    .from("entrega_citas")
    .insert({
      entrega_id: entregaId,
      milestone,
      fecha: input.fecha,
      hora: input.hora,
      notas: input.notas,
      created_by: auth.user!.id,
      updated_by: auth.user!.id,
    })
    .select("id")
    .single();

  if (citaErr) {
    if (citaErr.code === "23505") {
      return jsonError(
        409,
        `La unidad ${unit.unit_number} ya tiene agendada su ${MILESTONE_LABELS[milestone].toLowerCase()}.`
      );
    }
    console.error("[POST /api/entregas] cita insert", citaErr);
    return jsonError(500, citaErr.message);
  }

  await logAudit(auth.user!, {
    eventType: "entrega.agendada",
    resourceType: "entrega_cita",
    resourceId: cita.id,
    resourceLabel: `${unit.unit_number} · ${MILESTONE_LABELS[milestone]}`,
    details: {
      unit_id: input.unit_id,
      unit_number: unit.unit_number,
      entrega_id: entregaId,
      milestone,
      fecha: input.fecha,
      hora: input.hora,
    },
    request,
  });

  // Return the board-shaped row so the client can insert without a refetch.
  const { data: full, error: fullErr } = await supabase
    .from("v_entregas_full")
    .select("*")
    .eq("cita_id", cita.id)
    .single();

  if (fullErr) {
    console.error("[POST /api/entregas] view read-back", fullErr);
    return jsonError(500, fullErr.message);
  }

  return jsonOk({ cita: full as EntregaCitaFull }, { status: 201 });
}
