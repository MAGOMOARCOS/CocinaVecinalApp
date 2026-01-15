"use client";

import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tipado mínimo y explícito para el perfil
 * (evita any y satisface eslint)
 */
type Profile = {
  role: "cook" | "both" | "user" | null;
  city: string | null;
  neighborhood: string | null;
};

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, city, neighborhood")
        .eq("id", user.id)
        .maybeSingle<Profile>();

      if (!profile || (profile.role !== "cook" && profile.role !== "both")) {
        router.replace("/onboarding");
        return;
      }

      setCity(profile.city ?? "");
      setNeighborhood(profile.neighborhood ?? "");
    };

    void loadProfile();
  }, [router]);

  async function create() {
    setSaving(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title,
      description: description || null,
      price_cents: Math.round(price * 100),
      currency: "COP",
      portions,
      city,
      neighborhood,
      allergens: [],
      photos: [],
      status: "active",
    });

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    router.replace("/my/listings");
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 p-6">
      <h1 className="text-xl font-semibold">Publicar un plato</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: solo barrio y ciudad. El punto exacto se concreta tras la reserva.
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
            placeholder="Ingredientes, horarios, incluye bebida…"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Precio (COP)</div>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Porciones</div>
            <input
              type="number"
              min={1}
              value={portions}
              onChange={(e) => setPortions(Number(e.target.value))}
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
            />
          </label>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-600">
          Fotos: la subida a Storage se activa en el siguiente sprint.
        </div>

        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

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
