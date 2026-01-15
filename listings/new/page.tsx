"use client";

import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  role: "cook" | "both" | "buyer" | null;
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

      const role = profile?.role ?? null;
      if (!role || (role !== "cook" && role !== "both")) {
        router.replace("/onboarding");
        return;
      }

      setCity(profile?.city ?? "");
      setNeighborhood(profile?.neighborhood ?? "");
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
            <div className="text-sm font-medium">Barrio</div>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>
        </div>

        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <button
          onClick={() => void create()}
          disabled={saving || !title.trim() || !city.trim() || !neighborhood.trim()}
          className="mt-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
