import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";
import { MILESTONE_LABELS, MILESTONES } from "@/lib/entregas/constants";
import type { EntregaCitaFull, EntregaEstado, EntregaMilestone } from "@/lib/entregas/types";

/** Postgres returns HH:MM:SS. The board groups a visit on HH:MM. */
function hourKey(hora: string): string {
  return hora.slice(0, 5);
}

interface CitaRow {
  id: string;
  milestone: EntregaMilestone;
  estado: EntregaEstado;
  fecha: string;
  hora: string;
  publicada: boolean;
}

/**
 * A cancelled cita is its own card. Every other cita of the same expediente
 * that shares its date and hour is one visit. Must match `groupKeyOf` in
 * `src/app/entregas/entregas-client.tsx`.
 */
function inPublishSlot(anchor: CitaRow, row: CitaRow): boolean {
  if (anchor.estado === "CANCELADA") return row.id === anchor.id;
  if (row.estado === "CANCELADA") return false;
  return row.fecha === anchor.fecha && hourKey(row.hora) === hourKey(anchor.hora);
}

/**
 * POST /api/entregas/citas/[id]/publicar
 *
 * Publishes the visit that contains this cita: both hitos when they share the
 * unit, date, and hour, or the single hito when it stands alone. Does not
 * change `estado`. A cita that is already published stays published; calling
 * this again is a no-op for that row.
 *
 * Auth: master + torredecontrol + entregas_editor.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("entregas", "publish"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: anchorRow, error: anchorErr } = await supabase
    .from("entrega_citas")
    .select("id, entrega_id, milestone, estado, fecha, hora, publicada")
    .eq("id", id)
    .maybeSingle();

  if (anchorErr) {
    console.error("[POST /api/entregas/citas/publicar]", anchorErr);
    return jsonError(500, anchorErr.message);
  }
  if (!anchorRow) return jsonError(404, "La cita no existe");

  const { data: hermanas, error: hermanasErr } = await supabase
    .from("entrega_citas")
    .select("id, milestone, estado, fecha, hora, publicada")
    .eq("entrega_id", anchorRow.entrega_id);

  if (hermanasErr) {
    console.error("[POST /api/entregas/citas/publicar] slot", hermanasErr);
    return jsonError(500, hermanasErr.message);
  }

  const anchor: CitaRow = {
    id: anchorRow.id,
    milestone: anchorRow.milestone as EntregaMilestone,
    estado: anchorRow.estado as EntregaEstado,
    fecha: anchorRow.fecha,
    hora: anchorRow.hora,
    publicada: anchorRow.publicada,
  };

  const slot = ((hermanas ?? []) as CitaRow[]).filter((row) => inPublishSlot(anchor, row));
  const pendingIds = slot.filter((row) => !row.publicada).map((row) => row.id);

  if (pendingIds.length > 0) {
    const { data: flipped, error: updateErr } = await supabase
      .from("entrega_citas")
      .update({
        publicada: true,
        publicada_at: new Date().toISOString(),
        publicada_by: auth.user!.id,
        updated_by: auth.user!.id,
      })
      .in("id", pendingIds)
      .eq("publicada", false)
      .select("id");

    if (updateErr) {
      console.error("[POST /api/entregas/citas/publicar] update", updateErr);
      return jsonError(500, updateErr.message);
    }

    const publishedIds = new Set((flipped ?? []).map((row) => row.id as string));
    if (publishedIds.size > 0) {
      const { data: labels, error: labelErr } = await supabase
        .from("v_entregas_full")
        .select("cita_id, unit_number, milestone, fecha, hora, estado, entrega_id")
        .in("cita_id", [...publishedIds]);

      if (labelErr) {
        console.error("[POST /api/entregas/citas/publicar] audit read", labelErr);
      } else {
        for (const cita of labels ?? []) {
          const milestone = cita.milestone as EntregaMilestone;
          await logAudit(auth.user!, {
            eventType: "entrega.publicada",
            resourceType: "entrega_cita",
            resourceId: cita.cita_id,
            resourceLabel: `${cita.unit_number} · ${MILESTONE_LABELS[milestone]}`,
            details: {
              entrega_id: cita.entrega_id,
              milestone,
              fecha: cita.fecha,
              hora: cita.hora,
              estado: cita.estado,
              publicada_con: [...publishedIds].filter((citaId) => citaId !== cita.cita_id),
            },
            request,
          });
        }
      }
    }
  }

  const { data: full, error: fullErr } = await supabase
    .from("v_entregas_full")
    .select("*")
    .in(
      "cita_id",
      slot.map((row) => row.id),
    );

  if (fullErr) {
    console.error("[POST /api/entregas/citas/publicar] view read-back", fullErr);
    return jsonError(500, fullErr.message);
  }

  const citas = ((full ?? []) as EntregaCitaFull[]).sort(
    (a, b) => MILESTONES.indexOf(a.milestone) - MILESTONES.indexOf(b.milestone),
  );

  return jsonOk({ citas });
}
