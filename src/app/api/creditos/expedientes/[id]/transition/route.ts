import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";
import { EXPEDIENTE_STATE_VALUES } from "@/lib/creditos/model.generated";

/**
 * Moves an expediente forward.
 *
 * **Widened at E04 (2026-09-22), as E02 planned.** The body now names any state; which
 * ones are actually reachable is the service's decision, not this file's — `avanzar()`
 * validates every transition against the legal set for that credit type, so a request
 * sent straight to this route cannot cross from Contado into the banking states.
 *
 * Two targets are still out of reach on purpose. `entregado` is derived from the keys
 * appointment and the service refuses it by hand. `desistido` needs a motive the body
 * has no field for, so the service refuses it too — desistimiento is E07, and notes on
 * a transition are E08.
 *
 * The rule that matters here is not in this file: declaring an expediente complete is
 * refused while any required document is still pending, and the service says how many
 * are missing (SDD v5 §8.4).
 */
const paramsSchema = z.object({ id: z.string().trim().min(1).max(200) });

const bodySchema = z
  .object({
    to_state: z.enum(EXPEDIENTE_STATE_VALUES),
  })
  .strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return jsonError(400, "El identificador del expediente no es válido.");

    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError(400, "El estado indicado no existe.");

    await auth.service.avanzar(params.data.id, body.data.to_state, auth.user.id);

    void logAudit(auth.user, {
      eventType: "credito.transicion",
      resourceType: "pai_credito_expediente",
      resourceId: params.data.id,
      details: { to_state: body.data.to_state },
      request,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return creditoError(error);
  }
}
