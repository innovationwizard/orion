import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";
import { CHECKLIST_ITEM_STATE_VALUES } from "@/lib/creditos/model.generated";

/**
 * Marks a document of one expediente — or takes a mark back.
 *
 * The same call does both: `pendiente` is as valid a target as `recibido` or `na`,
 * because marking the wrong row is an ordinary mistake (SDD v5 §6.2). The service
 * refuses the ones that are not ordinary: a document of another expediente, or any
 * change at all on a deleted one.
 */
const paramsSchema = z.object({
  id: z.string().trim().min(1).max(200),
  itemId: z.string().trim().min(1).max(200),
});

const bodySchema = z.object({ state: z.enum(CHECKLIST_ITEM_STATE_VALUES) }).strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return jsonError(400, "El documento indicado no es válido.");

    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError(400, "Indique si el documento está Pendiente, Recibido o No aplica.");

    await auth.service.marcar(params.data.id, params.data.itemId, body.data.state, auth.user.id);

    void logAudit(auth.user, {
      eventType: "credito.checklist_marca",
      resourceType: "pai_credito_checklist_item",
      resourceId: params.data.itemId,
      details: { expediente_id: params.data.id, state: body.data.state },
      request,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return creditoError(error);
  }
}
