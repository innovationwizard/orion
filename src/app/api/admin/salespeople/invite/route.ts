import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin, getSupabaseConfigError } from "@/lib/supabase";
import { jsonOk, jsonError } from "@/lib/api";

const inviteSchema = z.object({
  salesperson_id: z.string().uuid(),
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  if (!supabaseAdmin) {
    return jsonError(500, "SUPABASE_SERVICE_ROLE_KEY requerido");
  }

  const payload = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, "Entrada inválida", parsed.error.flatten());
  }

  const { salesperson_id, email } = parsed.data;

  // Verify salesperson exists
  const { data: sp, error: spErr } = await supabaseAdmin
    .from("salespeople")
    .select("id, full_name, user_id")
    .eq("id", salesperson_id)
    .single();

  if (spErr || !sp) {
    return jsonError(404, "Asesor no encontrado");
  }

  // If already has a user_id, resend invite instead of creating new
  if (sp.user_id) {
    // Update email if different, then resend
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      sp.user_id,
      { email },
    );
    if (updateErr) {
      return jsonError(500, "Error al actualizar usuario", updateErr.message);
    }

    // Resend invite
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
    if (!siteUrl) {
      return jsonError(500, "NEXT_PUBLIC_SITE_URL debe estar definido");
    }

    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${siteUrl}/auth/callback` },
    );
    if (inviteErr) {
      return jsonError(500, "Error al reenviar invitación", inviteErr.message);
    }

    // Update email on salespeople table
    await supabaseAdmin
      .from("salespeople")
      .update({ email })
      .eq("id", salesperson_id);

    return jsonOk({ user_id: sp.user_id, email, resent: true });
  }

  // New invite
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  if (!siteUrl) {
    return jsonError(500, "NEXT_PUBLIC_SITE_URL debe estar definido");
  }

  const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${siteUrl}/auth/callback`,
      data: { role: "ventas" },
    },
  );

  if (inviteErr) {
    return jsonError(500, "Error al enviar invitación", inviteErr.message);
  }

  const userId = inviteData.user?.id ?? null;

  // Link auth user to salesperson
  if (userId) {
    const { error: linkErr } = await supabaseAdmin
      .from("salespeople")
      .update({ user_id: userId, email })
      .eq("id", salesperson_id);

    if (linkErr) {
      console.error("[POST /api/admin/salespeople/invite] link error", linkErr);
      return jsonError(500, "Invitación enviada pero error al vincular cuenta", linkErr.message);
    }
  }

  return jsonOk({ user_id: userId, email, resent: false });
}
