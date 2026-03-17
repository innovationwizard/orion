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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  if (!siteUrl) {
    return jsonError(500, "NEXT_PUBLIC_SITE_URL debe estar definido");
  }

  // If already has a user_id, update email + generate magic link
  if (sp.user_id) {
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      sp.user_id,
      { email },
    );
    if (updateErr) {
      return jsonError(500, "Error al actualizar usuario", updateErr.message);
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (linkErr) {
      return jsonError(500, "Error al generar enlace", linkErr.message);
    }

    // Update email on salespeople table
    await supabaseAdmin
      .from("salespeople")
      .update({ email })
      .eq("id", salesperson_id);

    const actionLink = linkData?.properties?.action_link ?? null;
    return jsonOk({ user_id: sp.user_id, email, resent: true, invite_url: actionLink });
  }

  // New invite — generateLink creates the auth user without sending email
  const { data: linkData, error: inviteErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      data: { role: "ventas" },
    },
  });

  if (inviteErr) {
    return jsonError(500, "Error al generar invitación", inviteErr.message);
  }

  const userId = linkData?.user?.id ?? null;
  const actionLink = linkData?.properties?.action_link ?? null;

  // Link auth user to salesperson
  if (userId) {
    const { error: dbLinkErr } = await supabaseAdmin
      .from("salespeople")
      .update({ user_id: userId, email })
      .eq("id", salesperson_id);

    if (dbLinkErr) {
      console.error("[POST /api/admin/salespeople/invite] link error", dbLinkErr);
      return jsonError(500, "Enlace generado pero error al vincular cuenta", dbLinkErr.message);
    }
  }

  return jsonOk({ user_id: userId, email, resent: false, invite_url: actionLink });
}
