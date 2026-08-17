import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { actualizarCitaSchema } from "@/lib/entregas/validations";
import { ESTADO_LABELS, MILESTONE_LABELS } from "@/lib/entregas/constants";
import type { EntregaCitaFull, EntregaEstado, EntregaMilestone } from "@/lib/entregas/types";

/** Postgres returns HH:MM:SS; the client sends HH:MM. Compare on HH:MM. */
function sameTime(a: string, b: string): boolean {
  return a.slice(0, 5) === b.slice(0, 5);
}

/**
 * PATCH /api/entregas/citas/[id]
 *
 * Reschedules, confirms, completes or cancels one milestone. Moving the date or
 * hour returns the cita to PROGRAMADA and increments `reprogramaciones` — a
 * reschedule is history, not a state — and the before/after pair is written to
 * audit_events.
 *
 * Completing a cita has NO side effects on rv_units or reservations, by design.
 *
 * Auth: admins only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("entregas", "update"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data: input, error: pErr } = await parseJson(request, actualizarCitaSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { data: current, error: currentErr } = await supabase
    .from("entrega_citas")
    .select(
      "id, entrega_id, milestone, fecha, hora, estado, reprogramaciones, completada_at, cancelada_motivo",
    )
    .eq("id", id)
    .maybeSingle();

  if (currentErr) {
    console.error("[PATCH /api/entregas/citas]", currentErr);
    return jsonError(500, currentErr.message);
  }
  if (!current) return jsonError(404, "La cita no existe");

  const milestone = current.milestone as EntregaMilestone;
  const currentEstado = current.estado as EntregaEstado;

  // ---- Reschedule detection ----------------------------------------------
  const nuevaFecha = input.fecha ?? current.fecha;
  const nuevaHora = input.hora ?? current.hora;
  const reprogramada =
    nuevaFecha !== current.fecha || !sameTime(nuevaHora, current.hora);

  // A cancelled cita must be explicitly revived; rescheduling one silently
  // would resurrect an appointment nobody re-agreed to.
  if (reprogramada && currentEstado === "CANCELADA" && input.estado === undefined) {
    return jsonError(
      409,
      "La cita está cancelada. Cámbiela a Programada antes de moverla de fecha.",
    );
  }

  const patch: Record<string, unknown> = { updated_by: auth.user!.id };

  if (input.fecha !== undefined) patch.fecha = input.fecha;
  if (input.hora !== undefined) patch.hora = input.hora;
  if (input.notas !== undefined) patch.notas = input.notas;

  if (reprogramada) {
    patch.reprogramaciones = current.reprogramaciones + 1;
    // Moving the appointment invalidates a prior confirmation.
    if (input.estado === undefined && currentEstado === "CONFIRMADA") {
      patch.estado = "PROGRAMADA";
    }
  }

  const estadoFinal = (input.estado ?? patch.estado ?? currentEstado) as EntregaEstado;

  if (input.estado !== undefined) patch.estado = input.estado;

  // Keep the DB's coherence constraints satisfied from the API side, so a bad
  // combination surfaces as a clear message instead of a constraint violation.
  // Both fields are only rewritten on an actual transition — editing the notes
  // of a completed cita must not restamp when it was completed, and must not
  // demand a cancellation motive that was already recorded.
  if (estadoFinal === "COMPLETADA") {
    if (currentEstado !== "COMPLETADA") patch.completada_at = new Date().toISOString();
  } else {
    patch.completada_at = null;
  }

  if (estadoFinal === "CANCELADA") {
    const motivo = input.cancelada_motivo ?? current.cancelada_motivo ?? null;
    if (!motivo) {
      return jsonError(400, "Cancelar una cita requiere un motivo");
    }
    patch.cancelada_motivo = motivo;
  } else {
    patch.cancelada_motivo = null;
  }

  const { error: updateErr } = await supabase
    .from("entrega_citas")
    .update(patch)
    .eq("id", id);

  if (updateErr) {
    console.error("[PATCH /api/entregas/citas]", updateErr);
    return jsonError(500, updateErr.message);
  }

  // ---- Expediente-level fields -------------------------------------------
  if (input.tipo_pago !== undefined || input.banco !== undefined) {
    const expedientePatch: Record<string, unknown> = { updated_by: auth.user!.id };
    if (input.tipo_pago !== undefined) expedientePatch.tipo_pago = input.tipo_pago;
    if (input.banco !== undefined) {
      expedientePatch.banco = input.banco === "" ? null : input.banco;
    }

    const { error: expErr } = await supabase
      .from("entregas")
      .update(expedientePatch)
      .eq("id", current.entrega_id);

    if (expErr) {
      console.error("[PATCH /api/entregas/citas] expediente", expErr);
      return jsonError(500, expErr.message);
    }
  }

  const { data: full, error: fullErr } = await supabase
    .from("v_entregas_full")
    .select("*")
    .eq("cita_id", id)
    .single();

  if (fullErr) {
    console.error("[PATCH /api/entregas/citas] view read-back", fullErr);
    return jsonError(500, fullErr.message);
  }

  const cita = full as EntregaCitaFull;

  if (reprogramada) {
    await logAudit(auth.user!, {
      eventType: "entrega.reprogramada",
      resourceType: "entrega_cita",
      resourceId: id,
      resourceLabel: `${cita.unit_number} · ${MILESTONE_LABELS[milestone]}`,
      details: {
        fecha_anterior: current.fecha,
        hora_anterior: current.hora,
        fecha_nueva: cita.fecha,
        hora_nueva: cita.hora,
        reprogramaciones: cita.reprogramaciones,
      },
      request,
    });
  }

  if (input.estado !== undefined && input.estado !== currentEstado) {
    await logAudit(auth.user!, {
      eventType: "entrega.estado_cambiado",
      resourceType: "entrega_cita",
      resourceId: id,
      resourceLabel: `${cita.unit_number} · ${MILESTONE_LABELS[milestone]}`,
      details: {
        estado_anterior: ESTADO_LABELS[currentEstado],
        estado_nuevo: ESTADO_LABELS[input.estado as EntregaEstado],
        motivo: input.cancelada_motivo ?? null,
      },
      request,
    });
  }

  return jsonOk({ cita });
}

/**
 * DELETE /api/entregas/citas/[id]
 *
 * Removes a cita that should never have existed. Cancelling is the normal path
 * — this is for correcting a mistake. The expediente is removed alongside the
 * last remaining cita so no orphan rows accumulate.
 *
 * Auth: admins only.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("entregas", "delete"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cita, error: citaErr } = await supabase
    .from("v_entregas_full")
    .select("cita_id, entrega_id, milestone, unit_number, fecha, hora, estado")
    .eq("cita_id", id)
    .maybeSingle();

  if (citaErr) {
    console.error("[DELETE /api/entregas/citas]", citaErr);
    return jsonError(500, citaErr.message);
  }
  if (!cita) return jsonError(404, "La cita no existe");

  const { error: deleteErr } = await supabase
    .from("entrega_citas")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.error("[DELETE /api/entregas/citas]", deleteErr);
    return jsonError(500, deleteErr.message);
  }

  const { count, error: countErr } = await supabase
    .from("entrega_citas")
    .select("id", { count: "exact", head: true })
    .eq("entrega_id", cita.entrega_id);

  if (countErr) {
    console.error("[DELETE /api/entregas/citas] remaining count", countErr);
  } else if ((count ?? 0) === 0) {
    const { error: expErr } = await supabase
      .from("entregas")
      .delete()
      .eq("id", cita.entrega_id);
    if (expErr) {
      console.error("[DELETE /api/entregas/citas] expediente cleanup", expErr);
    }
  }

  await logAudit(auth.user!, {
    eventType: "entrega.eliminada",
    resourceType: "entrega_cita",
    resourceId: id,
    resourceLabel: `${cita.unit_number} · ${MILESTONE_LABELS[cita.milestone as EntregaMilestone]}`,
    details: {
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      entrega_id: cita.entrega_id,
    },
    request,
  });

  return jsonOk({ deleted: true });
}
