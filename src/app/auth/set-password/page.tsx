"use client";

import { useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/** Translate known Supabase Auth error messages to Spanish */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Password is known to be weak and easy to guess, please choose a different one.":
      "Esta contraseña es muy común y fácil de adivinar. Por favor elige una diferente.",
    "New password should be different from the old password.":
      "La nueva contraseña debe ser diferente a la anterior.",
    "Password should be at least 6 characters.":
      "La contraseña debe tener al menos 6 caracteres.",
    "Auth session missing!":
      "Sesión no encontrada. Solicita un nuevo enlace de invitación.",
  };
  return translations[message] ?? message;
}

interface PasswordCheck {
  label: string;
  met: boolean;
}

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "Al menos 8 caracteres", met: password.length >= 8 },
    { label: "Al menos una mayúscula (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Al menos una minúscula (a-z)", met: /[a-z]/.test(password) },
    { label: "Al menos un número (0-9)", met: /[0-9]/.test(password) },
  ];
}

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const allChecksPassed = checks.every((c) => c.met);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!allChecksPassed) {
      setError("La contraseña no cumple con todos los requisitos.");
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
      setError(translateAuthError(updateError.message));
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

          {/* Password strength checklist — visible once user starts typing */}
          {password.length > 0 && (
            <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 13, lineHeight: 1.8 }}>
              {checks.map((c) => (
                <li key={c.label} style={{ color: c.met ? "var(--success)" : "var(--text-muted)" }}>
                  {c.met ? "✓" : "○"} {c.label}
                </li>
              ))}
            </ul>
          )}

          {error ? <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl font-medium">{error}</div> : null}
          <button
            className="border-none bg-primary text-white px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading || !allChecksPassed || password !== confirm || password.length === 0}
          >
            {isLoading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </section>
  );
}
