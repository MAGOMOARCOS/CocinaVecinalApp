"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Ajusta si tu proyecto usa otro helper; aquí uso supabase-js directo para evitar imports rotos.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type OrderStatus = "pending" | "accepted" | "rejected" | "completed";

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  notes: string | null;
  status: OrderStatus;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asOrderStatus(v: unknown): OrderStatus {
  const s = typeof v === "string" ? v : "";
  if (s === "pending" || s === "accepted" || s === "rejected" || s === "completed") return s;
  return "pending";
}

function normalizeOrder(row: unknown): OrderRow | null {
  if (!isRecord(row)) return null;

  const id = asString(row["id"]);
  const created_at = asString(row["created_at"]) ?? new Date().toISOString();

  if (!id) return null;

  return {
    id,
    created_at,
    customer_name: asString(row["customer_name"]),
    phone: asString(row["phone"]),
    notes: asString(row["notes"]),
    status: asOrderStatus(row["status"]),
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSupabase = useMemo(() => Boolean(supabase), []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("Supabase no está configurado (faltan NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (qErr) {
      setLoading(false);
      setError(qErr.message);
      return;
    }

    const safe: OrderRow[] = Array.isArray(data)
      ? data.map((r: unknown) => normalizeOrder(r)).filter((x): x is OrderRow => x !== null)
      : [];

    setOrders(safe);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    if (!supabase) {
      setError("Supabase no está configurado.");
      return;
    }

    setError(null);

    const { error: uErr } = await supabase.from("orders").update({ status }).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      return;
    }

    // Actualiza estado local sin recargar todo
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  if (!canUseSupabase) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Orders</h1>
        <p style={{ marginTop: 8 }}>
          Falta configurar variables: <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <button onClick={() => void refresh()} disabled={loading} style={{ padding: "6px 10px" }}>
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      {error ? (
        <p style={{ marginTop: 12, color: "crimson" }}>
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {orders.length === 0 && !loading ? <p>No hay pedidos.</p> : null}

        {orders.map((o) => (
          <div
            key={o.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {o.customer_name ?? "Cliente"}{" "}
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>({o.id})</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                  }}
                >
                  {o.status}
                </span>

                <select
                  value={o.status}
                  onChange={(e) => void updateOrderStatus(o.id, e.target.value as OrderStatus)}
                  style={{ padding: "6px 8px" }}
                >
                  <option value="pending">pending</option>
                  <option value="accepted">accepted</option>
                  <option value="rejected">rejected</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>

            {o.phone ? (
              <div style={{ fontSize: 13 }}>
                <strong>Tel:</strong> {o.phone}
              </div>
            ) : null}

            {o.notes ? (
              <div style={{ fontSize: 13 }}>
                <strong>Notas:</strong> {o.notes}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
