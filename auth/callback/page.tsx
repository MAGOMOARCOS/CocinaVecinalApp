"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Single import (avoid TS "Duplicate identifier 'supabase'" error)
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // If you're using OAuth redirect flow, Supabase handles the session internally.
      // This page can just verify session and redirect.
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/"); // o "/onboarding" si lo prefieres
      } else {
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-lg font-semibold">Conectando…</h1>
      <p className="mt-2 text-sm text-neutral-600">Procesando autenticación.</p>
    </main>
  );
}
