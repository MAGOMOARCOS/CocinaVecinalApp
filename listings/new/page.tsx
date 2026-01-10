"use client";

import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewListingPage() {
  return (
    <RequireAuth>
      <NewListingInner />
    </RequireAuth>
  );
}

function NewListingInner() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(15000); // COP
  const [portions, setPortions] = useState(3);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("role, city, neighborhood")
        .eq("id", user.id)
        .maybeSingle();

      const role = (p as any)?.role;
      if (!role || (role !== "cook" && role !== "both")) {
        router.replace("/onboarding");
        return;
      }
      setCity((p as any)?.city ?? "");
      setNeighborhood((p as any)?.neighborhood ?? "");
    })();
  }, [router]);

  async function create() {
    setSaving(true);
    setErr("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title,
      description: description || null,
      price_cents: Math.round(Number(price) * 100),
      currency: "COP",
      portions: Number(portions),
      city,
      neighborhood,
      allergens: [],
      photos: [],
      status: "active",
    });

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    router.replace("/my/listings");
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 p-6">
      <h1 className="text-xl font-semibold">Publicar un plato</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: muestra solo barrio/ciudad. El punto exacto se concreta tras la reserva.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <div className="text-sm font-medium">Título</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            placeholder="Ej. Ajiaco santafereño casero"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Descripción</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            rows={4}
            placeholder="Ingredientes, horarios, si incluye bebida…"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Precio (COP)</div>
            <input
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Porciones</div>
            <input
              value={portions}
              onChange={(e) => setPortions(Number(e.target.value))}
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>
        </div>

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
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
              placeholder="Ej. Chapinero"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-600">
          Fotos: en esta versión el campo existe pero la subida a Storage la activamos en el siguiente sprint (para no atascarte con permisos).
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button
          onClick={create}
          disabled={saving || !title || !city || !neighborhood}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
