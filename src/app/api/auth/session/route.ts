import { requireAuth } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;

  return jsonOk({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.app_metadata?.role ?? auth.user.user_metadata?.role ?? null,
    },
  });
}
