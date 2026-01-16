"use client";
export const dynamic = "force-dynamic";

import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Listing } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function money(cents: number, currency: string) {
  const value = cents / 100;
  return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(value);
}

export default function MyListingsPage() {
  return (
    <RequireAuth>
      <MyListingsInner />
    </RequireAuth>
  );
}

function MyListingsInner() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Listing[]>();

    if (error) setErr(error.message);
    setListings(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Llamada diferida: evita el patrón “llamo función que setea state directamente en el cuerpo del effect”
    const t = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(t);
  }, [refresh]);

  async function setStatus(id: string, status: Listing["status"]) {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    void refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis platos</h1>
          <p className="mt-2 text-sm text-neutral-600">Activa/pausa/agotado sin borrar el anuncio.</p>
        </div>

        <Link href="/listings/new" className="rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800">
          Publicar
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Cargando…</div>
      ) : err ? (
        <div className="text-sm text-red-600">{err}</div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-600">
          Aún no has publicado. Publica tu primer plato.
        </div>
      ) : (
        <div className="grid gap-3">
          {listings.map((l) => (
            <div key={l.id} className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{l.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {l.neighborhood}, {l.city}
                  </div>
                  <div className="mt-2 text-sm text-neutral-700">
                    {money(l.price_cents, l.currency)} · {l.portions} porciones
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Estado actual: <b>{l.status}</b>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => setStatus(l.id, "active")}
                    className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Activar
                  </button>
                  <button
                    onClick={() => setStatus(l.id, "paused")}
                    className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Pausar
                  </button>
                  <button
                    onClick={() => setStatus(l.id, "soldout")}
                    className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Agotado
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <Link className="hover:underline" href={`/listings/${l.id}`}>
                  Ver como usuario
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
