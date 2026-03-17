"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isInviteFlow = searchParams.get("flow") === "invite";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    // flow=invite: ensure role is set (metadata may not have been applied by Supabase)
    const userData: { password_set: boolean; role?: string } = { password_set: true };
    if (isInviteFlow) {
      userData.role = "ventas";
    }

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
      data: userData,
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
      <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ margin: 0 }}>Establecer contraseña</h2>
        <p className="text-muted m-0">
          Ingresa tu nueva contraseña.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <input
            className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
          <input
            className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
          {error ? <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl font-medium">{error}</div> : null}
          <button className="border-none bg-primary text-white px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover" type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <section className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
        <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <p className="text-muted m-0">Cargando…</p>
        </div>
      </section>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
