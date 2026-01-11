"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMsg("");

    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMsg(error.message);
      return;
    }

    setStatus("sent");
    setMsg("Te hemos enviado un enlace de acceso. Revisa tu correo.");
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 p-6">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Te enviamos un enlace mágico por email (sin contraseña).
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="block">
          <div className="text-sm font-medium">Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            placeholder="tu@email.com"
          />
        </label>

        <button
          disabled={status==="sending"}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {status==="sending" ? "Enviando…" : "Enviar enlace"}
        </button>

        {msg ? (
          <div className={`text-sm ${status==="error" ? "text-red-600" : "text-neutral-700"}`}>
            {msg}
          </div>
        ) : null}
      </form>
    </div>
  );
}
