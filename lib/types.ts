// lib/types.ts
export interface Listing {
  id: string | number;
  title?: string | null;
  description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  image_url?: string | null;
  [key: string]: unknown;
}

export interface Order {
  id: string | number;
  listing_id?: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  listing?: Listing | null;
  [key: string]: unknown;
}
