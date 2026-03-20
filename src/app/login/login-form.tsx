"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (mode === "reset") {
      const { error: resetError } =
        await supabaseBrowser.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/auth/confirm`,
        });

      setIsLoading(false);
      if (resetError) {
        setError("No se pudo enviar el correo. Inténtalo de nuevo.");
        return;
      }
      setMessage("Revisa tu correo para restablecer tu contraseña.");
      return;
    }

    const { error: authError } =
      await supabaseBrowser.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
      setIsLoading(false);
      return;
    }

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
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 12, marginTop: 12 }}
    >
      <input
        className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {mode === "login" && (
        <input
          className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-text-primary text-sm"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      )}
      {error ? <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl font-medium">{error}</div> : null}
      {message ? (
        <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl font-medium" style={{ background: "var(--positive-bg, #e8f5e9)", color: "var(--positive, #2e7d32)" }}>
          {message}
        </div>
      ) : null}
      <button className="border-none bg-primary text-white px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover" type="submit" disabled={isLoading}>
        {isLoading
          ? mode === "reset"
            ? "Enviando..."
            : "Ingresando..."
          : mode === "reset"
            ? "Enviar enlace"
            : "Entrar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "reset" : "login");
          setError(null);
          setMessage(null);
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 13,
          textAlign: "center",
          padding: 0,
        }}
      >
        {mode === "login"
          ? "¿Olvidaste tu contraseña?"
          : "Volver a iniciar sesión"}
      </button>
    </form>
  );
}
