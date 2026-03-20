import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

const inviteSchema = z.object({
  salesperson_id: z.string().uuid(),
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  const admin = createAdminClient();

  const payload = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, "Entrada inválida", parsed.error.flatten());
  }

  const { salesperson_id, email } = parsed.data;

  // Verify salesperson exists
  const { data: sp, error: spErr } = await admin
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

  // Build a URL to our own /auth/confirm route (server-side token verification).
  // This bypasses Supabase's hosted /auth/v1/verify redirect which causes client-side
  // race conditions (the Supabase JS client auto-consumes hash tokens before React renders).
  function buildConfirmUrl(hashedToken: string, type: string): string {
    const url = new URL(`${siteUrl}/auth/confirm`);
    url.searchParams.set("token_hash", hashedToken);
    url.searchParams.set("type", type);
    return url.toString();
  }

  // If already has a user_id, update email + ensure app_metadata role + generate magic link
  if (sp.user_id) {
    const { error: updateErr } = await admin.auth.admin.updateUserById(
      sp.user_id,
      {
        email,
        app_metadata: { role: "ventas" },
      },
    );
    if (updateErr) {
      return jsonError(500, "Error al actualizar usuario", updateErr.message);
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) {
      return jsonError(500, "Error al generar enlace", linkErr.message);
    }

    await admin
      .from("salespeople")
      .update({ email })
      .eq("id", salesperson_id);

    const hashedToken = linkData?.properties?.hashed_token ?? null;
    const inviteUrl = hashedToken ? buildConfirmUrl(hashedToken, "magiclink") : null;

    await logAudit(auth.user!, {
      eventType: "salesperson.invited",
      resourceType: "salesperson",
      resourceId: salesperson_id,
      resourceLabel: `${sp.full_name} (${email})`,
      details: { email, resent: true },
      request,
    });

    return jsonOk({ user_id: sp.user_id, email, resent: true, invite_url: inviteUrl });
  }

  // New invite — generateLink creates the auth user without sending email
  const { data: linkData, error: inviteErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { role: "ventas" },
    },
  });

  // If invite fails (e.g. email already registered via Supabase GUI), find existing user and generate magic link
  if (inviteErr) {
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!existingUser) {
      return jsonError(500, "Error al generar invitación", inviteErr.message);
    }

    // Role in app_metadata only (immutable by client, embedded in JWT)
    await admin.auth.admin.updateUserById(existingUser.id, {
      app_metadata: { role: "ventas" },
    });

    // Link existing auth user to salesperson
    const { error: dbLinkErr } = await admin
      .from("salespeople")
      .update({ user_id: existingUser.id, email })
      .eq("id", salesperson_id);

    if (dbLinkErr) {
      console.error("[POST /api/admin/salespeople/invite] link error", dbLinkErr);
      return jsonError(500, "Error al vincular cuenta existente", dbLinkErr.message);
    }

    // Generate magic link for existing user
    const { data: mlData, error: mlErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (mlErr) {
      return jsonError(500, "Usuario vinculado pero error al generar enlace", mlErr.message);
    }

    const hashedToken = mlData?.properties?.hashed_token ?? null;
    const inviteUrl = hashedToken ? buildConfirmUrl(hashedToken, "magiclink") : null;

    await logAudit(auth.user!, {
      eventType: "salesperson.invited",
      resourceType: "salesperson",
      resourceId: salesperson_id,
      resourceLabel: `${sp.full_name} (${email})`,
      details: { email, resent: false, existing_user: true },
      request,
    });

    return jsonOk({ user_id: existingUser.id, email, resent: false, invite_url: inviteUrl });
  }

  const userId = linkData?.user?.id ?? null;

  // Set app_metadata role (generateLink data option only sets user_metadata)
  if (userId) {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "ventas" },
    });

    const { error: dbLinkErr } = await admin
      .from("salespeople")
      .update({ user_id: userId, email })
      .eq("id", salesperson_id);

    if (dbLinkErr) {
      console.error("[POST /api/admin/salespeople/invite] link error", dbLinkErr);
      return jsonError(500, "Enlace generado pero error al vincular cuenta", dbLinkErr.message);
    }
  }

  const hashedToken = linkData?.properties?.hashed_token ?? null;
  const inviteUrl = hashedToken ? buildConfirmUrl(hashedToken, "invite") : null;

  await logAudit(auth.user!, {
    eventType: "salesperson.invited",
    resourceType: "salesperson",
    resourceId: salesperson_id,
    resourceLabel: `${sp.full_name} (${email})`,
    details: { email, resent: false },
    request,
  });

  return jsonOk({ user_id: userId, email, resent: false, invite_url: inviteUrl });
}
