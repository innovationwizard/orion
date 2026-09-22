import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";

/**
 * Adds to one expediente a document the catalogue does not list — the bank asking for
 * something extra is ordinary (SDD v5 §6.2).
 *
 * The person writes the name and says whether it is required for this case; the key is
 * derived here rather than typed, so nothing technical-looking reaches the screen. The
 * row is always marked as added by hand, and the service refuses a duplicate key —
 * including one that collides with a catalogue document, which is the point: asking for
 * "DPI" again should be refused, not duplicated.
 */
const paramsSchema = z.object({ id: z.string().trim().min(1).max(200) });

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    is_required: z.boolean(),
  })
  .strict();

/** "Carta adicional del banco" → "carta_adicional_del_banco". Accents folded, not dropped. */
export function documentKeyFrom(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) return jsonError(400, "El identificador del expediente no es válido.");

    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError(400, "Escriba el nombre del documento e indique si es obligatorio para este caso.");

    const documentKey = documentKeyFrom(body.data.name);
    if (!documentKey) {
      return jsonError(400, "El nombre del documento debe tener al menos una letra o un número.");
    }

    const itemId = await auth.service.agregarDocumento(
      params.data.id,
      {
        documentKey,
        name: body.data.name,
        condition: null,
        isRequired: body.data.is_required,
      },
      auth.user.id,
    );

    void logAudit(auth.user, {
      eventType: "credito.checklist_agregar",
      resourceType: "pai_credito_checklist_item",
      resourceId: itemId,
      details: { expediente_id: params.data.id, document_key: documentKey, is_required: body.data.is_required },
      request,
    });

    return jsonOk({ id: itemId }, { status: 201 });
  } catch (error) {
    return creditoError(error);
  }
}
