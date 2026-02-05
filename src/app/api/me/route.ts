import { NextResponse } from "next/server";
import { requireAuth, isSuperuser, getUserRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    data: {
      email: auth.user?.email ?? null,
      is_superuser: isSuperuser(auth.user?.email ?? null),
      role: getUserRole(auth.user ?? null)
    }
  });
}
