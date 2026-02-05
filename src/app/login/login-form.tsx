"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
      setIsLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <input
        className="input"
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? <div className="banner">{error}</div> : null}
      <button className="button" type="submit" disabled={isLoading}>
        {isLoading ? "Ingresando..." : "Entrar"}
      </button>
    </form>
  );
}
