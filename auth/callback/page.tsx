"use client";
import { supabase } from "../../lib/supabaseClient";
import { supabase as supabaseClient } from "../../lib/supabaseClient";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
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

      const { data: p } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      router.replace(p ? "/" : "/onboarding");
    }
    run();
  }, [router]);

  return <div className="text-sm text-neutral-500">Finalizando acceso…</div>;
}
