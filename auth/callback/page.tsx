"use client";

import { supabase } from "../../lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          router.replace("/login");
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userData.user.id)
          .maybeSingle();

        router.replace(profile ? "/" : "/onboarding");
      } catch {
        router.replace("/login");
      }
    }

    run();
  }, [router]);

  return <div className="text-sm text-neutral-500">Finalizando acceso…</div>;
}
