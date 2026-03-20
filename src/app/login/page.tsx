import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import LoginForm from "./login-form";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getUser() {
  const cookieStore = await cookies();
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (_name: string, _value: string, _options: CookieOptions) => {},
      remove: (_name: string, _options: CookieOptions) => {}
    }
  });

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    const role = user.app_metadata?.role as string | undefined;
    if (role === "ventas") {
      redirect("/ventas/dashboard");
    } else {
      redirect("/");
    }
  }

  return (
    <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
      <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ margin: 0 }}>Ingresar</h2>
        <p className="text-muted m-0">
          Accede con tu correo y contraseña.
        </p>
        <LoginForm />
      </div>
    </section>
  );
}
