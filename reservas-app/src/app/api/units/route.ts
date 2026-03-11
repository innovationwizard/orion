import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const projectSlug = searchParams.get("project");
  const towerId = searchParams.get("tower");

  const supabase = createAdminClient();

  let query = supabase.from("v_units_full").select("*");

  if (projectSlug) {
    query = query.eq("project_slug", projectSlug);
  }

  if (towerId) {
    query = query.eq("tower_id", towerId);
  }

  query = query.order("floor_number", { ascending: false }).order("unit_number");

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/units]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
