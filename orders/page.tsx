"use client";

import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Order, Listing } from "@/lib/types";
import { useEffect, useState } from "react";

function money(cents: number, currency: string) {
  const value = cents / 100;
  return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(value);
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersInner />
    </RequireAuth>
  );
}

function OrdersInner() {
  const [asBuyer, setAsBuyer] = useState<Order[]>([]);
  const [asSeller, setAsSeller] = useState<Order[]>([]);
  const [listingById, setListingById] = useState<Record<string, Listing>>({});
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    setUserId(user.id);

    const { data: ob } = await supabase.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false });
    const { data: os } = await supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });

    const all = [...(ob as any ?? []), ...(os as any ?? [])] as Order[];
    const listingIds = Array.from(new Set(all.map(o => o.listing_id)));

    let map: Record<string, Listing> = {};
    if (listingIds.length) {
      const { data: ls } = await supabase.from("listings").select("*").in("id", listingIds);
      for (const l of (ls as any ?? []) as Listing[]) map[l.id] = l;
    }

    setAsBuyer((ob as any) ?? []);
    setAsSeller((os as any) ?? []);
    setListingById(map);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function updateOrder(id: string, status: Order["status"]) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    refresh();
  }

  if (loading) return <div className="text-sm text-neutral-500">Cargando pedidos…</div>;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Flujo MVP: solicitado → aceptado → listo → completado (o cancelado).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Como comprador</h2>
        {asBuyer.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-600">Aún no has hecho reservas.</div>
        ) : (
          <div className="grid gap-3">
            {asBuyer.map(o => (
              <OrderRow key={o.id} o={o} listing={listingById[o.listing_id]} me={userId} onUpdate={updateOrder} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Como cocinero</h2>
        {asSeller.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-600">Aún no tienes pedidos.</div>
        ) : (
          <div className="grid gap-3">
            {asSeller.map(o => (
              <OrderRow key={o.id} o={o} listing={listingById[o.listing_id]} me={userId} onUpdate={updateOrder} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderRow({ o, listing, me, onUpdate }: { o: Order; listing?: Listing; me: string; onUpdate: (id: string, status: Order["status"]) => void }) {
  const title = listing?.title ?? "Plato";
  const currency = listing?.currency ?? "COP";
  const isBuyer = o.buyer_id === me;
  const isSeller = o.seller_id === me;

  const actions: Array<{ label: string; status: Order["status"]; show: boolean }> = [
    { label: "Cancelar", status: "cancelled", show: isBuyer && o.status === "requested" },
    { label: "Aceptar", status: "accepted", show: isSeller && o.status === "requested" },
    { label: "Marcar listo", status: "ready", show: isSeller && o.status === "accepted" },
    { label: "Completar", status: "completed", show: (isSeller && o.status === "ready") || (isBuyer && o.status === "ready") },
    { label: "Cancelar", status: "cancelled", show: isSeller && (o.status === "requested" || o.status === "accepted") },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="mt-1 text-xs text-neutral-500">Estado: <b>{o.status}</b></div>
          {listing ? <div className="mt-1 text-xs text-neutral-500">{listing.neighborhood}, {listing.city}</div> : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold">{money(o.total_cents, currency)}</div>
          <div className="mt-1 text-xs text-neutral-500">x{o.quantity}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions.filter(a => a.show).map(a => (
          <button
            key={a.label + a.status}
            onClick={() => onUpdate(o.id, a.status)}
            className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50 text-sm"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
