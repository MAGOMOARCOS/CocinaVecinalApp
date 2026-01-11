"use client";

import { supabase } from "../../lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      try {
        // Intercambia el código de autenticación por una sesión
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error("Error al intercambiar el código de sesión:", error.message);
          router.replace("/login");
          return;
        }

        // Obtiene el usuario autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error("No se pudo obtener el usuario:", userError?.message);
          router.replace("/login");
          return;
        }

        // Comprueba si existe el perfil en la base de datos
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error al consultar el perfil:", profileError.message);
          router.replace("/login");
          return;
        }

        // Redirige según exista o no el perfil
        router.replace(profile ? "/" : "/onboarding");
      } catch (err) {
        console.error("Error inesperado:", err);
        router.replace("/login");
      }
    }

    run();
  }, [router]);

  return <div className="text-sm text-neutral-500">Finalizando acceso…</div>;
}
