"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Listing, Profile } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [neighFilter, setNeighFilter] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      let p: Profile | null = null;
      if (userData.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();
        p = (prof as any) ?? null;
      }

      if (!mounted) return;
      setProfile(p);

      // Public feed (active). If profile exists -> suggest city/neighborhood.
      const city = cityFilter || p?.city || "";
      const neighborhood = neighFilter || p?.neighborhood || "";

      let q = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(40);

      if (city) q = q.eq("city", city);
      if (neighborhood) q = q.eq("neighborhood", neighborhood);

      const { data: ls } = await q;
      if (!mounted) return;
      setListings((ls as any) ?? []);
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [cityFilter, neighFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Comida casera cerca de ti</h1>
        <p className="mt-2 text-neutral-600">
          Marketplace entre vecinos. En este MVP mostramos solo <b>barrio</b> y <b>ciudad</b> (no dirección exacta).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Filtrar por ciudad</div>
            <input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder={profile?.city ?? "Ej. Bogotá"}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Filtrar por barrio</div>
            <input
              value={neighFilter}
              onChange={(e) => setNeighFilter(e.target.value)}
              placeholder={profile?.neighborhood ?? "Ej. Chapinero"}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/listings/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
          >
            Publicar un plato
          </Link>
          <Link
            href="/orders"
            className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
          >
            Ver pedidos
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ofertas activas</h2>
          <Link className="text-sm hover:underline" href="/login">Entrar</Link>
        </div>

        {loading ? (
          <div className="text-sm text-neutral-500">Cargando listados…</div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-600">
            No hay platos activos con ese filtro. Prueba otra ciudad/barrio.
          </div>
        ) : (
          <div className="grid gap-3">
            {listings.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 p-6 text-sm text-neutral-700">
        <div className="font-semibold">¿Quieres “instalarla” como app?</div>
        <div className="mt-2 text-neutral-600">
          Al tener manifest, en Chrome/Android verás “Instalar”. En iPhone: Compartir → “Añadir a pantalla de inicio”.
        </div>
      </section>
    </div>
  );
}
