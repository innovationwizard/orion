import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { DATA_VIEWER_ROLES } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role as string | undefined;
  if (role === "ventas") redirect("/ventas/dashboard");
  if (!role || !(DATA_VIEWER_ROLES as string[]).includes(role)) redirect("/login");

  return (
    <Suspense
      fallback={
        <section className="bg-card rounded-2xl p-4 shadow-card grid gap-2.5">
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "40%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "90%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "85%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "80%" }} />
        </section>
      }
    >
      <DashboardClient role={role} />
    </Suspense>
  );
}
