import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";
import { CREDIT_TYPE_VALUES, CREDIT_SUBTYPE_VALUES, EXPEDIENTE_STATE_VALUES } from "@/lib/creditos/model.generated";

const createSchema = z.object({
  reservation_id: z.string().trim().min(1).max(200),
  credit_type: z.enum(CREDIT_TYPE_VALUES),
  credit_subtype: z.enum(CREDIT_SUBTYPE_VALUES),
}).strict();

export async function POST(request: Request) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;
    const input = createSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return jsonError(400, "Seleccione la compra, el tipo y el subtipo de crédito.");
    const { reservation_id, credit_type, credit_subtype } = input.data;
    const id = await auth.service.crear(reservation_id, credit_type, credit_subtype, auth.user.id);
    void logAudit(auth.user, {
      eventType: "credito.creacion",
      resourceType: "pai_credito_expediente",
      resourceId: id,
      details: input.data,
      request,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    return creditoError(error);
  }
}

const listSchema = z.object({
  company_id: z.string().uuid().optional(),
  credit_type: z.enum(CREDIT_TYPE_VALUES).optional(),
  state: z.enum(EXPEDIENTE_STATE_VALUES).optional(),
  include_deleted: z.enum(["true", "false"]).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;
    const input = listSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!input.success) return jsonError(400, "Los filtros del listado no son válidos.");
    const expedientes = await auth.service.list({
      companyId: input.data.company_id,
      creditType: input.data.credit_type,
      state: input.data.state,
      includeDeleted: input.data.include_deleted === "true",
    });
    return jsonOk({ expedientes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return creditoError(error);
  }
}
