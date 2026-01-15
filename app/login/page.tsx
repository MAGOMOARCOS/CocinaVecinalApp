"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/my";

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!email.includes("@")) throw new Error("Email inválido");
      if (password.length < 6) throw new Error("Mínimo 6 caracteres");

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // importante: callback dentro de tu dominio
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: "" },
          },
        });
        if (error) throw error;

        // Si tu proyecto tiene confirmación por email activada,
        // aquí informamos y no redirigimos todavía.
        router.push(`/login?next=${encodeURIComponent(next)}&check=1`);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.push(next);
      }
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  const check = sp.get("check");

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <h1 className="text-xl font-semibold">Acceso</h1>
        <p className="mt-1 text-sm text-white/70">
          {mode === "login" ? "Entra con tu cuenta" : "Crea tu cuenta"}
        </p>

        {check === "1" && (
          <div className="mt-4 rounded-xl bg-emerald-500/15 p-3 text-emerald-200">
            Revisa tu email para confirmar el registro (si tu proyecto lo exige).
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm text-white/80">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
              placeholder="••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/15 p-3 text-red-200">{error}</div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-60"
          >
            {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white"
          >
            {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
