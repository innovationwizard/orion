import { NextRequest } from "next/server";
import { extractReceiptData, toSupportedMediaType } from "@/lib/claude";
import { RECEIPT_UPLOAD } from "@/lib/reservas/constants";
import { jsonOk, jsonError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const rl = rateLimit(`ocr:${auth.user!.id}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return jsonError(429, "Demasiadas solicitudes. Intente de nuevo más tarde.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "Se esperaba multipart/form-data");
  }

  const file = formData.get("receipt");
  if (!file || !(file instanceof File)) {
    return jsonError(400, "Campo 'receipt' requerido (archivo de imagen)");
  }

  if (file.size > RECEIPT_UPLOAD.MAX_SIZE_BYTES) {
    return jsonError(400, `Archivo muy grande. Máximo: ${RECEIPT_UPLOAD.MAX_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const mediaType = toSupportedMediaType(file.type);
  if (!mediaType) {
    if (file.type === "application/pdf" || file.type === "image/heic") {
      return jsonError(400, "Para archivos PDF o HEIC, suba una captura de pantalla en formato JPG o PNG.");
    }
    return jsonError(400, `Tipo de archivo no soportado: ${file.type}`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const extraction = await extractReceiptData(base64, mediaType);

  if (!extraction) {
    return jsonError(422, "No se pudo extraer datos del comprobante. Intente con una imagen más clara.");
  }

  return jsonOk(extraction);
}
