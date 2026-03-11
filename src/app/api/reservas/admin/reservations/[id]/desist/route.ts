import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { desistReservationSchema } from "@/lib/reservas/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reservationId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = desistReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("desist_reservation", {
    p_reservation_id: reservationId,
    p_admin_user_id: parsed.data.admin_user_id,
    p_reason: parsed.data.reason,
    p_desistimiento_date: parsed.data.desistimiento_date,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservations/desist]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "DESISTED" });
}
