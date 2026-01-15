// lib/types.ts

export type Role = "buyer" | "cook" | "both";

export type ListingStatus =
  | "active"
  | "paused"
  | "sold_out"
  | "soldout"
  | (string & {}); // permite futuros estados sin romper TS

export interface Listing extends Record<string, unknown> {
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
  status: ListingStatus;
  user_id: string;
  created_at: string | null;

  image_url: string | null;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | (string & {});

export interface Order extends Record<string, unknown> {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;

  quantity: number;
  total_cents: number;
  status: OrderStatus;
  created_at?: string | null;

  listing?: Listing | null;
}
