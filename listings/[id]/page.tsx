"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Listing } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";

function money(cents: number, currency: string) {
  const value = cents / 100;
  return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(value);
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [l, setL] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("listings").select("*").eq("id", params.id).maybeSingle();
      if (!mounted) return;
      setL((data as any) ?? null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [params.id]);

  if (loading) return <div className="text-sm text-neutral-500">Cargando…</div>;
  if (!l) return <div className="text-sm text-neutral-600">No encontrado.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl border border-neutral-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{l.title}</h1>
            <div className="mt-2 text-sm text-neutral-600">{l.neighborhood}, {l.city}</div>
            <div className="mt-2 inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
              {l.status}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">{money(l.price_cents, l.currency)}</div>
            <div className="text-sm text-neutral-500">{l.portions} porciones</div>
          </div>
        </div>

        {l.description ? <p className="mt-4 text-neutral-700">{l.description}</p> : null}

        <div className="mt-6">
          <Reserve listing={l} />
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 p-6 text-sm text-neutral-600">
        Privacidad: el punto exacto se concreta tras la reserva (MVP).
      </div>
    </div>
  );
}

function Reserve({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const disabled = listing.status !== "active";

  return (
    <RequireAuth>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Cantidad</span>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
            disabled={disabled}
          />
        </div>

        <button
          disabled={busy || disabled}
          onClick={async () => {
            setBusy(true);
            setErr("");
            const { data: userData } = await supabase.auth.getUser();
            const user = userData.user;
            if (!user) {
              router.replace("/login");
              return;
            }

            const total = listing.price_cents * qty;

            const { error } = await supabase.from("orders").insert({
              listing_id: listing.id,
              buyer_id: user.id,
              seller_id: listing.user_id,
              quantity: qty,
              total_cents: total,
              status: "requested",
            });

            if (error) {
              setErr(error.message);
              setBusy(false);
              return;
            }

            router.replace("/orders");
          }}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {disabled ? "No disponible" : busy ? "Reservando…" : "Reservar"}
        </button>
      </div>

      {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
    </RequireAuth>
  );
}
