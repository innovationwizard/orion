import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitReservationSchema } from "@/lib/reservas/validations";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de solicitud inválido" },
      { status: 400 },
    );
  }

  const parsed = submitReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("submit_reservation", {
    p_unit_id: input.unit_id,
    p_salesperson_id: input.salesperson_id,
    p_client_names: input.client_names,
    p_client_phone: input.client_phone,
    p_deposit_amount: input.deposit_amount,
    p_deposit_date: input.deposit_date,
    p_deposit_bank: input.deposit_bank,
    p_receipt_type: input.receipt_type,
    p_depositor_name: input.depositor_name,
    p_receipt_image_url: input.receipt_image_url,
    p_lead_source: input.lead_source,
    p_notes: input.notes,
  });

  if (error) {
    console.error("[POST /api/reservas/reservations]", error);

    if (error.message.includes("no disponible") || error.message.includes("not available")) {
      return NextResponse.json(
        { error: "Esta unidad ya no está disponible. Otro asesor puede haberla reservado." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { reservation_id: data, status: "PENDING_REVIEW" },
    { status: 201 },
  );
}
