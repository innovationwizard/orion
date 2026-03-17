"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Auth callback: handles invite / magic link / OAuth return.
 * - Hash (#access_token=...): invite flow, setSession and redirect.
 * - Query (?code=...): PKCE flow, exchangeCodeForSession and redirect.
 */
async function needsPasswordSetup(): Promise<boolean> {
  const { data: { user } } = await supabaseBrowser.auth.getUser();
  if (!user) return false;
  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);
  return role === "ventas" && user.user_metadata?.password_set !== true;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const next = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") ?? "/"
        : "/";
      const flowInvite = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("flow") === "invite"
        : false;

      const redirectToSetPassword = (withFlow = false) => {
        router.replace(withFlow ? "/auth/set-password?flow=invite" : "/auth/set-password");
      };

      // PKCE: ?code=...
      const code = new URLSearchParams(search).get("code");
      if (code) {
        const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (error) {
          setStatus("error");
          return;
        }
        // flow=invite: always require password (role metadata may not be set yet)
        if (flowInvite) {
          redirectToSetPassword(true);
          return;
        }
        if (await needsPasswordSetup()) {
          redirectToSetPassword();
          return;
        }
        router.replace(next);
        return;
      }

      // Invite / magic link: #access_token=...&refresh_token=...
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabaseBrowser.auth.setSession({
            access_token,
            refresh_token
          });
          if (!mounted) return;
          if (error) {
            setStatus("error");
            return;
          }
          // flow=invite: always require password (role metadata may not be set yet)
          if (flowInvite) {
            redirectToSetPassword(true);
            return;
          }
          if (await needsPasswordSetup()) {
            redirectToSetPassword();
            return;
          }
          router.replace(next);
          return;
        }
      }

      setStatus("done");
      router.replace("/");
    }

    handleCallback();
    return () => {
      mounted = false;
    };
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
