import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { can } from "@/lib/permissions";
import EntregasClient from "./entregas-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const metadata: Metadata = {
  title: "Entregas | Boulevard 5",
  description:
    "Cronograma de escrituración y entrega de unidades de Boulevard 5 — agenda semanal, estado por hito y titular por apartamento",
};

async function getRole(): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (_name: string, _value: string, _options: CookieOptions) => {},
      remove: (_name: string, _options: CookieOptions) => {},
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return (data.user.app_metadata?.role as string | undefined) ?? null;
}

export default async function EntregasPage() {
  const role = await getRole();

  if (!role) redirect("/login");
  if (!can(role, "entregas", "view")) redirect("/login");

  return (
    <Suspense>
      <EntregasClient canEdit={can(role, "entregas", "update")} />
    </Suspense>
  );
}
