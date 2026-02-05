import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const superuserEmails = (process.env.SUPERUSER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function getSupabaseAuthClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {}
    }
  });
}

export async function requireAuth() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response: NextResponse.json(
        { error: "Faltan variables de entorno de Supabase" },
        { status: 500 }
      )
    };
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  return { user: data.user };
}

export type Role =
  | "master"
  | "gerencia"
  | "financiero"
  | "contabilidad"
  | "ventas"
  | "inventario";

export function getUserRole(user: User | null) {
  const role =
    (user?.app_metadata?.role as string | undefined) ??
    (user?.user_metadata?.role as string | undefined);
  return role ?? null;
}

export function isSuperuser(email?: string | null) {
  if (!email) {
    return false;
  }
  return superuserEmails.includes(email.toLowerCase());
}

export function hasRole(user: User | null, roles: Role[]) {
  const role = getUserRole(user);
  if (!role) {
    return false;
  }
  return roles.includes(role as Role);
}

export async function requireSuperuser() {
  const auth = await requireAuth();
  if (auth.response) {
    return auth;
  }
  const allowed =
    isSuperuser(auth.user?.email ?? null) ||
    hasRole(auth.user ?? null, ["master"]);
  if (!allowed) {
    return { response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return auth;
}
