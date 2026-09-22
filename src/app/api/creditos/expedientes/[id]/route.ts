import { logAudit } from "@/lib/audit";
import { CUMPLIMIENTO_CATEGORIA_VALUES } from "@/lib/creditos/model.generated";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;
    const input = z.object({ id: z.string().trim().min(1).max(200) }).safeParse(await context.params);
    if (!input.success) return jsonError(400, "El identificador del expediente no es válido.");
    // The history rides along: the service already reads it, so a screen that wants to
    // show what happened costs no extra call (decided 2026-09-21).
    const { expediente, checklist, history } = await auth.service.detail(input.data.id);
    return jsonOk({ expediente, checklist, history }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return creditoError(error);
  }
}

const editSchema = z.object({
  cumplimiento_categoria: z.enum(CUMPLIMIENTO_CATEGORIA_VALUES).nullable(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;
    const params = z.object({ id: z.string().trim().min(1).max(200) }).safeParse(await context.params);
    if (!params.success) return jsonError(400, "El identificador del expediente no es válido.");
    const body = editSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError(400, "Seleccione Normal, PEP, CPE o Sin clasificar.");
    await auth.service.editarCumplimiento(params.data.id, body.data.cumplimiento_categoria, auth.user.id);
    void logAudit(auth.user, {
      eventType: "credito.edicion",
      resourceType: "pai_credito_expediente",
      resourceId: params.data.id,
      details: body.data,
      request,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return creditoError(error);
  }
}
