import { NextRequest, NextResponse } from "next/server";
import { extractReceiptData, toSupportedMediaType } from "@/lib/claude";
import { RECEIPT_UPLOAD } from "@/lib/reservas/constants";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Se esperaba multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("receipt");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'receipt' requerido (archivo de imagen)" },
      { status: 400 },
    );
  }

  if (file.size > RECEIPT_UPLOAD.MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Archivo muy grande. Máximo: ${RECEIPT_UPLOAD.MAX_SIZE_BYTES / 1024 / 1024}MB` },
      { status: 400 },
    );
  }

  const mediaType = toSupportedMediaType(file.type);
  if (!mediaType) {
    if (file.type === "application/pdf" || file.type === "image/heic") {
      return NextResponse.json(
        { error: "Para archivos PDF o HEIC, suba una captura de pantalla en formato JPG o PNG." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Tipo de archivo no soportado: ${file.type}` },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const extraction = await extractReceiptData(base64, mediaType);

  if (!extraction) {
    return NextResponse.json(
      { error: "No se pudo extraer datos del comprobante. Intente con una imagen más clara." },
      { status: 422 },
    );
  }

  return NextResponse.json(extraction);
}
