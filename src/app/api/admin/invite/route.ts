import { z } from "zod";
import { NextResponse } from "next/server";
import { supabaseAdmin, getSupabaseConfigError } from "@/lib/supabase";
import { requireSuperuser } from "@/lib/auth";

const inviteSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const auth = await requireSuperuser();
  if (auth.response) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY requerido para invitaciones" },
      { status: 500 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Entrada inválida", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    parsed.data.email
  );

  if (error) {
    return NextResponse.json({ error: "Error al enviar invitación", details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      user_id: data.user?.id ?? null,
      email: data.user?.email ?? parsed.data.email
    }
  });
}
