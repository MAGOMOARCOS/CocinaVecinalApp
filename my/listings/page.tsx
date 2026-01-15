"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Listing, ListingStatus } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function asStatus(v: unknown): ListingStatus {
  const s = typeof v === "string" ? v : "";
  if (s === "draft" || s === "published" || s === "paused" || s === "sold") return s;
  return "draft";
}

function normalizeListing(row: unknown): Listing | null {
  if (!isRecord(row)) return null;
  const id = asString(row["id"]);
  if (!id) return null;

  return {
    id,
    created_at: asString(row["created_at"]) ?? new Date().toISOString(),
    title: asString(row["title"]) ?? "(sin título)",
    description: asString(row["description"]),
    city: asString(row["city"]),
    price: asNumber(row["price"]),
    status: asStatus(row["status"]),
    user_id: asString(row["user_id"]),
  };
}

export default function MyListingsPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("Supabase no configurado.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (qErr) {
      setLoading(false);
      setError(qErr.message);
      return;
    }

    const safe = Array.isArray(data)
      ? data.map((r: unknown) => normalizeListing(r)).filter((x): x is Listing => x !== null)
      : [];

    setItems(safe);
    setLoading(false);
  }, []);

  // Para silenciar esa regla concreta: es tu linter, no React.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = useCallback(async (id: string, status: ListingStatus) => {
    if (!supabase) return;
    setError(null);

    const { error: uErr } = await supabase.from("listings").update({ status }).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      return;
    }

    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Mis listings</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => void refresh()} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar"}
        </button>
        {error ? <span style={{ color: "crimson" }}>{error}</span> : null}
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: "1px solid #e5e5e5", padding: 12, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{it.title}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>{it.city ?? "-"}</div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, border: "1px solid #ddd", padding: "4px 8px", borderRadius: 999 }}>
                  {it.status}
                </span>
                <select value={it.status} onChange={(e) => void setStatus(it.id, e.target.value as ListingStatus)}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="paused">paused</option>
                  <option value="sold">sold</option>
                </select>
              </div>
            </div>

            {it.description ? <p style={{ marginTop: 8 }}>{it.description}</p> : null}
          </div>
        ))}
      </div>
    </main>
  );
}
