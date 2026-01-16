"use client";

import { useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!supabase) {
      setError("Supabase no configurado (faltan env vars).");
      return;
    }

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signErr) {
      setError(signErr.message);
      return;
    }

    setOk(true);
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button type="submit">Entrar</button>
      </form>

      {ok ? <p style={{ color: "green" }}>OK</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
