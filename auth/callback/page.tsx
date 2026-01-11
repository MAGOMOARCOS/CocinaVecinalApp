"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data: userData } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (!userData?.user) {
        router.replace("/login");
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      router.replace(p ? "/" : "/onboarding");
    };

    run();
  }, [router]);

  return <div className="text-sm text-neutral-500">Finalizando acceso…</div>;
}
