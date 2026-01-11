// lib/types.ts
export type Role = "buyer" | "cook" | "both";
export interface Listing {
  id: string;
  title: string;
  description: string | null;

  // pricing
  price_cents: number;
  currency: string;
  portions: number;

  // location
  neighborhood: string;
  city: string;

  // lifecycle
  status: string; // "active" | "paused" | "sold_out" ... (si luego quieres lo tipamos)
  user_id: string;
  created_at: string | null;

  image_url: string | null;

  // Permite columnas extra sin romper TS (evita futuros "unknown")
  [key: string]: any;
}

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;

  quantity: number;
  total_cents: number;
  status: string;
  created_at?: string | null;

  listing?: Listing | null;

  [key: string]: any;
}
