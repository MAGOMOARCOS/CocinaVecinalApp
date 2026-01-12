"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error("[auth/callback] exchange error:", error);
        }
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
      } finally {
        if (!cancelled) router.replace("/");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-lg font-semibold">Completando inicio de sesión…</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Si no redirige automáticamente, puedes cerrar esta pestaña.
      </p>
    </main>
  );
}
