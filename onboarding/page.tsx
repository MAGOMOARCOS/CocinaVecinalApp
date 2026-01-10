"use client";

import RequireAuth from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingInner />
    </RequireAuth>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("Bogotá");
  const [neighborhood, setNeighborhood] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email && !displayName) {
        setDisplayName(data.user.email.split("@")[0]);
      }
    });
  }, [displayName]);

  async function save() {
    setSaving(true);
    setErr("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      role,
      city,
      neighborhood,
    });

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 p-6">
      <h1 className="text-xl font-semibold">Configura tu perfil</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Para proteger tu privacidad, en el MVP mostraremos solo <b>barrio</b> y <b>ciudad</b>.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <div className="text-sm font-medium">Nombre visible</div>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Ciudad</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Barrio / Zona</div>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ej. Chapinero"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>
        </div>

        <fieldset className="rounded-2xl border border-neutral-200 p-4">
          <legend className="px-2 text-sm font-medium">¿Cómo usarás Cocina Vecinal?</legend>
          <div className="mt-2 grid gap-2 text-sm">
            {[
              ["buyer", "Quiero comprar comida casera"],
              ["cook", "Quiero vender platos"],
              ["both", "Ambas cosas"],
            ].map(([v, label]) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value={v}
                  checked={role === v}
                  onChange={() => setRole(v as Role)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}
