import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import ContableClient from "@/app/pabi/contable/contable-client";

export const metadata: Metadata = {
  title: "Contable | Puerta Abierta",
  description:
    "Reportes de contabilidad para directiva — Cobros, Comisiones, Presupuestos, Desistimientos, Cesión de Derechos, PCV & Expedientes, Contabilidad General y Legal",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Mismo patrón que src/app/page.tsx: lee la sesión desde la cookie en el servidor. */
async function getUser() {
  const cookieStore = await cookies();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (_name: string, _value: string, _options: CookieOptions) => {},
      remove: (_name: string, _options: CookieOptions) => {},
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export default async function ContablePage() {
  // Verificación de sesión propia de la página, sin depender sólo del
  // middleware: quien no tenga sesión no ve el tablero. A propósito NO filtra
  // por rol todavía — cualquier usuario con sesión entra. Cuando se decida qué
  // roles corresponden, el filtro va aquí (ver src/app/page.tsx como ejemplo).
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <Suspense>
      <ContableClient />
    </Suspense>
  );
}
