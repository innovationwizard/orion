import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const superuserEmails = (process.env.SUPERUSER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function getSupabaseAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (_name: string, _value: string, _options: CookieOptions) => {},
      remove: (_name: string, _options: CookieOptions) => {}
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

  const supabase = await getSupabaseAuthClient();
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
  | "inventario"
  | "torredecontrol";

const ROLE_LEVEL: Record<Role, number> = {
  ventas: 10,
  inventario: 20,
  contabilidad: 30,
  financiero: 40,
  gerencia: 50,
  torredecontrol: 60,
  master: 70,
};

/** Admin roles that can manage reservations and operational data. */
export const ADMIN_ROLES: Role[] = ["master", "torredecontrol"];

/** Roles that can view all analytics/financial data (admin + future finance roles). */
export const DATA_VIEWER_ROLES: Role[] = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"];

/** Check if user's role is at or above the required minimum level. */
export function hasMinimumRole(user: User | null, minimumRole: Role): boolean {
  const role = getUserRole(user);
  if (!role) return false;
  return (ROLE_LEVEL[role as Role] ?? 0) >= ROLE_LEVEL[minimumRole];
}

export function getUserRole(user: User | null) {
  return (user?.app_metadata?.role as string | undefined) ?? null;
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

export async function requireRole(roles: Role[]) {
  const auth = await requireAuth();
  if (auth.response) {
    return auth;
  }
  const allowed =
    isSuperuser(auth.user?.email ?? null) ||
    hasRole(auth.user ?? null, roles);
  if (!allowed) {
    return { response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return auth;
}
