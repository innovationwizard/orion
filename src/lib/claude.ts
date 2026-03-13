import Anthropic from "@anthropic-ai/sdk";
import type { OcrExtractionResult, DpiExtractionResult } from "./reservas/types";

const OCR_SYSTEM_PROMPT = `Sos un extractor de datos de comprobantes bancarios guatemaltecos.
Extraé los siguientes campos del comprobante en la imagen.
Respondé ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.

{
  "amount": number o null,
  "date": "YYYY-MM-DD" o null,
  "bank": string o null,
  "reference_number": string o null,
  "account_last_digits": string o null,
  "depositor_name": string o null,
  "receipt_type": "TRANSFER" | "DEPOSIT_SLIP" | "NEOLINK" | "MOBILE_SCREENSHOT" | "CHECK" | "OTHER",
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

Bancos comunes: Banrural, Industrial, G&T Continental, BAM, Bantrab,
Inmobiliario, Crédito Hipotecario Nacional (CHN), Agromercantil, BAC,
Promerica, Vivibanco, Ficohsa.

Tipos de comprobante:
- TRANSFER: comprobante de transferencia bancaria (muestra origen y destino)
- DEPOSIT_SLIP: boleta de depósito físico en ventanilla
- NEOLINK: voucher de pago digital NeoLink/pasarela de pago (usualmente no muestra nombre)
- MOBILE_SCREENSHOT: captura de pantalla de app de banca móvil
- CHECK: imagen de cheque
- OTHER: cualquier otro formato

"depositor_name" es el nombre de la persona que aparece como ordenante,
depositante, o titular de la cuenta origen. IMPORTANTE: este nombre puede
no ser el comprador del apartamento. La mayoría de comprobantes NO contienen
este dato — poné null si no aparece.

Si no podés leer un campo con certeza, poné null.
"confidence" es HIGH si amount y date son legibles,
MEDIUM si falta alguno menor, LOW si la imagen es ilegible.`;

type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * Extract structured financial data from a bank receipt image using Claude Vision.
 *
 * @param imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param mediaType - MIME type of the image
 * @returns Parsed extraction result, or null if extraction fails completely
 */
export async function extractReceiptData(
  imageBase64: string,
  mediaType: SupportedMediaType,
): Promise<OcrExtractionResult | null> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CLAUDE_API_KEY environment variable.");
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: OCR_SYSTEM_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return null;
  }

  const cleaned = textBlock.text.replace(/```json\n?|```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as OcrExtractionResult;
    return parsed;
  } catch {
    console.error("[OCR] Failed to parse Claude response as JSON:", cleaned);
    return null;
  }
}

const DPI_SYSTEM_PROMPT = `Sos un extractor de datos de documentos de identidad guatemaltecos (DPI / CUI).
Extraé los siguientes campos de la imagen del DPI.
Respondé ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.

{
  "cui": string o null,
  "full_name": string o null,
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

El CUI (Código Único de Identificación) es un número de 13 dígitos que aparece
en el DPI guatemalteco. Usualmente está en la parte frontal, cerca de la foto.
Formato típico: XXXX XXXXX XXXX (4-5-4 dígitos). Devolvé SOLO los 13 dígitos
sin espacios ni guiones.

"full_name" es el nombre completo del titular como aparece en el DPI
(nombres + apellidos). Conservá mayúsculas y acentos tal como aparecen.

Si no podés leer un campo con certeza, poné null.
"confidence" es HIGH si el CUI es claramente legible,
MEDIUM si es parcialmente legible, LOW si la imagen es ilegible.`;

/**
 * Extract CUI and full name from a Guatemalan DPI photo using Claude Vision.
 *
 * @param imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param mediaType - MIME type of the image
 * @returns Parsed extraction result, or null if extraction fails completely
 */
export async function extractDpiData(
  imageBase64: string,
  mediaType: SupportedMediaType,
): Promise<DpiExtractionResult | null> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CLAUDE_API_KEY environment variable.");
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: DPI_SYSTEM_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return null;
  }

  const cleaned = textBlock.text.replace(/```json\n?|```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as DpiExtractionResult;
    return parsed;
  } catch {
    console.error("[DPI-OCR] Failed to parse Claude response as JSON:", cleaned);
    return null;
  }
}

/**
 * Determine the media type from a file's MIME type string.
 * Returns null if the type is not supported for Vision API.
 */
export function toSupportedMediaType(mimeType: string): SupportedMediaType | null {
  const supported: Record<string, SupportedMediaType> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
    "image/gif": "image/gif",
  };
  return supported[mimeType] ?? null;
}
