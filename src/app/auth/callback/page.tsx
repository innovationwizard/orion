"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Auth callback — minimal fallback handler.
 *
 * Primary auth flows (invite, password reset) use /auth/confirm (server-side).
 * This page only handles the edge case where hash-based tokens arrive here
 * (e.g. via AuthHashRedirect or a Supabase redirect that bypasses /auth/confirm).
 *
 * After setting the session, redirects to / — middleware enforces password setup
 * and page restrictions for ventas users.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      const hash = window.location.hash;

      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabaseBrowser.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!mounted) return;
          if (error) {
            setStatus("error");
            return;
          }
        }
      }

      // Middleware enforces /auth/set-password for ventas users without password_set
      if (mounted) router.replace("/");
    }

    handleCallback();
    return () => { mounted = false; };
  }, [router]);

  if (status === "error") {
    return (
      <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
        <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2" style={{ maxWidth: 420, margin: "0 auto" }}>
          <p>No se pudo completar el acceso. Intenta de nuevo o <a href="/login">inicia sesión</a>.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
      <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <p className="text-muted m-0">Completando acceso…</p>
      </div>
    </section>
  );
}
