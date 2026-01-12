"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // Si viene "code", intercambiamos por sesión
        if (code) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch (e) {
        // no bloqueamos el flujo por un error puntual
        console.error(e);
      } finally {
        router.replace("/my");
      }
    };

    run();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Finalizando inicio de sesión…</h1>
        <p className="mt-2 text-sm text-neutral-600">Redirigiendo…</p>
      </div>
    </main>
  );
}
