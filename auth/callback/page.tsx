"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // En supabase-js v2, tras volver del redirect, la sesión se hidrata sola.
      // Aquí solo “esperamos un tick” y redirigimos.
      await supabase.auth.getSession();
      router.replace("/"); // o "/onboarding" si prefieres
    };

    run().catch(() => {
      router.replace("/login");
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <h1 className="text-xl font-semibold">Completando inicio de sesión…</h1>
      <p className="text-sm text-neutral-600">
        Un momento, te estamos redirigiendo.
      </p>
    </main>
  );
}
