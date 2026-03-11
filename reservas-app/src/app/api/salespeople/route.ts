import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("salespeople")
    .select("id, full_name, display_name")
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    console.error("[GET /api/salespeople]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
