import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Salesperson } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Success = { salesperson: Salesperson };
type Failure = { response: NextResponse };

/**
 * Extracts the authenticated user from the request cookies, then resolves
 * the corresponding salesperson record. Returns 401 if not authenticated,
 * 403 if the user is not linked to a salesperson.
 */
export async function requireSalesperson(): Promise<Success | Failure> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response: NextResponse.json(
        { error: "Faltan variables de entorno de Supabase" },
        { status: 500 },
      ),
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (_name: string, _value: string, _options: CookieOptions) => {},
      remove: (_name: string, _options: CookieOptions) => {},
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  // Look up salesperson by auth user_id
  const admin = createAdminClient();
  const { data: salesperson, error: spError } = await admin
    .from("salespeople")
    .select("id, full_name, display_name, phone, email, is_active, created_at, updated_at")
    .eq("user_id", data.user.id)
    .single();

  if (spError || !salesperson) {
    return {
      response: NextResponse.json(
        { error: "Tu cuenta no está vinculada a un asesor de ventas" },
        { status: 403 },
      ),
    };
  }

  if (!salesperson.is_active) {
    return {
      response: NextResponse.json(
        { error: "Tu cuenta de asesor está desactivada" },
        { status: 403 },
      ),
    };
  }

  return { salesperson: salesperson as Salesperson };
}

/** Type guard to check if requireSalesperson returned a failure */
export function isSalespersonFailure(
  result: Success | Failure,
): result is Failure {
  return "response" in result;
}
