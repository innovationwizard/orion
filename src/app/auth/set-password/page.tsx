"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
      data: { password_set: true },
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    // Confirm password_set in app_metadata (immutable by client)
    await fetch("/api/auth/confirm-password-set", { method: "POST" });

    // Hard navigation (not router.replace) guarantees middleware runs on fresh server request
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    const role = user?.app_metadata?.role;
    if (role === "ventas") {
      window.location.href = "/ventas/dashboard";
    } else {
      window.location.href = "/";
    }
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
