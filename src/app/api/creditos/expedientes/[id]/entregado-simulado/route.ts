import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";
import { isLocalLab, ORIGEN_SIMULADO } from "@/lib/creditos/lab";

/**
 * TEMPORARY — simulates the Entregas keys appointment in the local lab only (E06).
 *
 * The guard runs first and on the server: against any database other than the local
 * lab this route does not exist, whatever the screen shows or a request sends. It calls
 * the same `marcarEntregado()` the real Entregas gate will call, tagged with its own
 * origin. Delete it together with `src/lib/creditos/lab.ts` when that gate lands.
 */
const paramsSchema = z.object({ id: z.string().trim().min(1).max(200) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isLocalLab(process.env.NEXT_PUBLIC_SUPABASE_URL)) return jsonError(404, "No encontrado.");
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return jsonError(400, "El identificador del expediente no es válido.");

    const moved = await auth.service.marcarEntregado(params.data.id, auth.user.id, ORIGEN_SIMULADO);
    if (!moved) {
      return jsonError(400, "La entrega solo puede simularse en «Escrituración completada».");
    }

    void logAudit(auth.user, {
      eventType: "credito.transicion",
      resourceType: "pai_credito_expediente",
      resourceId: params.data.id,
      details: { to_state: "entregado", origen: ORIGEN_SIMULADO },
      request,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return creditoError(error);
  }
}
