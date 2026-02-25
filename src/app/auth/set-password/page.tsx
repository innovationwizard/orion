"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SetPasswordPage() {
  const router = useRouter();
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
    <section className="page">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ margin: 0 }}>Establecer contraseña</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Ingresa tu nueva contraseña.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <input
            className="input"
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
          <input
            className="input"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
          {error ? <div className="banner">{error}</div> : null}
          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </section>
  );
}
