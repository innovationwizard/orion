import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * POST /api/auth/confirm-password-set
 *
 * Called by /auth/set-password after the user successfully sets their password.
 * Sets password_set: true in app_metadata (immutable by client) so the middleware
 * can reliably enforce the password-setup gate for ventas users.
 */
export async function POST() {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(auth.user.id, {
    app_metadata: { password_set: true },
  });

  if (error) {
    return jsonError(500, "Error al confirmar contraseña", error.message);
  }

  return jsonOk({ ok: true });
}
