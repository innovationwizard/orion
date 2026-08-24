import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson, parseQuery } from "@/lib/api";
import { agendarCitaSchema, entregasQuerySchema } from "@/lib/entregas/validations";
import { ENTREGAS_PROJECT_SLUG, MILESTONE_LABELS, MILESTONES } from "@/lib/entregas/constants";
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
 * Schedules one or both milestones (ESCRITURA, LLAVES) for a unit. Two
 * milestones in a single request share the date and hour: the client comes
 * once, firma y recibe llaves. They stay two rows so each keeps its own estado
 * — a day where the escritura is signed but the keys are held back is a real
 * outcome — and they are inserted in one statement so the pair can never land
 * half-scheduled.
 *
 * The expediente is created on first use and reused afterwards, so tipo de pago
 * and banco are captured once per unit rather than once per cita.
 *
 * Auth: admins only.
 */
export async function POST(request: Request) {
  const auth = await requireRole(rolesFor("entregas", "create"));
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, agendarCitaSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Canonical order (escritura before llaves) so the response, the audit trail
  // and the board all read the milestones the same way.
  const milestones = (input.milestones as EntregaMilestone[])
    .slice()
    .sort((a, b) => MILESTONES.indexOf(a) - MILESTONES.indexOf(b));

  const etiquetaHitos = milestones.map((m) => MILESTONE_LABELS[m].toLowerCase()).join(" y ");

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

  // ---- Expediente: reuse if the unit already has one ----------------------
  const { data: existing, error: existingErr } = await supabase
    .from("entregas")
    .select("id, tipo_pago, banco, entrega_citas(milestone)")
    .eq("unit_id", input.unit_id)
    .maybeSingle();

  if (existingErr) {
    console.error("[POST /api/entregas] expediente lookup", existingErr);
    return jsonError(500, existingErr.message);
  }

  let entregaId: string;

  if (existing) {
    // Reject before inserting so the message names the milestone that clashes
    // rather than surfacing a bare unique-constraint violation.
    const yaAgendados = (
      (existing.entrega_citas ?? []) as unknown as { milestone: EntregaMilestone }[]
    ).map((c) => c.milestone);
    const choques = milestones.filter((m) => yaAgendados.includes(m));
    if (choques.length > 0) {
      return jsonError(
        409,
        `La unidad ${unit.unit_number} ya tiene agendada su ${choques
          .map((m) => MILESTONE_LABELS[m].toLowerCase())
          .join(" y su ")}.`
      );
    }

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

  // ---- Citas --------------------------------------------------------------
  // One statement: if the second row violates the unique constraint, neither
  // row is written and the caller retries a coherent request.
  const { data: nuevas, error: citaErr } = await supabase
    .from("entrega_citas")
    .insert(
      milestones.map((milestone) => ({
        entrega_id: entregaId,
        milestone,
        fecha: input.fecha,
        hora: input.hora,
        notas: input.notas,
        created_by: auth.user!.id,
        updated_by: auth.user!.id,
      }))
    )
    .select("id, milestone");

  if (citaErr) {
    // The pre-check above catches the ordinary case; this covers a concurrent
    // insert between the check and the write.
    if (citaErr.code === "23505") {
      return jsonError(
        409,
        `La unidad ${unit.unit_number} ya tiene agendada su ${etiquetaHitos}.`
      );
    }
    console.error("[POST /api/entregas] cita insert", citaErr);
    return jsonError(500, citaErr.message);
  }

  const creadas = (nuevas ?? []) as { id: string; milestone: EntregaMilestone }[];

  for (const cita of creadas) {
    await logAudit(auth.user!, {
      eventType: "entrega.agendada",
      resourceType: "entrega_cita",
      resourceId: cita.id,
      resourceLabel: `${unit.unit_number} · ${MILESTONE_LABELS[cita.milestone]}`,
      details: {
        unit_id: input.unit_id,
        unit_number: unit.unit_number,
        entrega_id: entregaId,
        milestone: cita.milestone,
        fecha: input.fecha,
        hora: input.hora,
        // Both milestones scheduled together into the same slot.
        agendada_con: milestones.filter((m) => m !== cita.milestone),
      },
      request,
    });
  }

  // Return the board-shaped rows so the client can insert without a refetch.
  const { data: full, error: fullErr } = await supabase
    .from("v_entregas_full")
    .select("*")
    .in(
      "cita_id",
      creadas.map((c) => c.id)
    );

  if (fullErr) {
    console.error("[POST /api/entregas] view read-back", fullErr);
    return jsonError(500, fullErr.message);
  }

  const citas = ((full ?? []) as EntregaCitaFull[]).sort(
    (a, b) => MILESTONES.indexOf(a.milestone) - MILESTONES.indexOf(b.milestone)
  );

  return jsonOk({ citas }, { status: 201 });
}
