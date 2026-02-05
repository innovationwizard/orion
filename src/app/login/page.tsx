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
    redirect("/");
  }

  return (
    <section className="page">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ margin: 0 }}>Ingresar</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Accede con tu correo y contraseña.
        </p>
        <LoginForm />
      </div>
    </section>
  );
}
