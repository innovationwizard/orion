import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

const schema = z.object({ email: z.string().email("Email inválido") });

/**
 * Quick workaround: generate a recovery link so admin can manually send user
 * to set-password. No email sent — admin copies link and shares (WhatsApp, etc).
 */
export async function POST(request: Request) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  if (!siteUrl) return jsonError(500, "NEXT_PUBLIC_SITE_URL debe estar definido");

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return jsonError(400, "Entrada inválida", parsed.error.flatten());

  const { email } = parsed.data;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) return jsonError(500, "Error al generar enlace", error.message);

  const hashedToken = data?.properties?.hashed_token ?? null;
  if (!hashedToken) return jsonError(500, "No se obtuvo token del enlace");

  const url = new URL(`${siteUrl}/auth/confirm`);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", "recovery");

  return jsonOk({ set_password_url: url.toString(), email });
}
