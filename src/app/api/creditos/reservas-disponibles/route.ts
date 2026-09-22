import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { creditoError, requireCreditoService } from "@/lib/creditos/http";

const querySchema = z.object({ search: z.string().trim().max(200).optional() });

export async function GET(request: Request) {
  try {
    const auth = await requireCreditoService();
    if (auth.response) return auth.response;
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return jsonError(400, "La búsqueda debe tener como máximo 200 caracteres.");
    const reservas = await auth.service.reservationsAvailable(query.data.search);
    return jsonOk({ reservas }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return creditoError(error);
  }
}
