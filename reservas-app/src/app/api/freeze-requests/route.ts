import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitFreezeSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = submitFreezeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("submit_freeze", {
    p_unit_id: parsed.data.unit_id,
    p_salesperson_id: parsed.data.salesperson_id,
    p_reason: parsed.data.reason,
    p_vip_name: parsed.data.vip_name,
  });

  if (error) {
    console.error("[POST /api/freeze-requests]", error);

    if (error.message.includes("Only available")) {
      return NextResponse.json(
        { error: "Solo se pueden congelar unidades disponibles." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ freeze_id: data, status: "ACTIVE" }, { status: 201 });
}
