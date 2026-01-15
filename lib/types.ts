export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Role = "cocinero" | "cliente" | "admin";

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  city: string;
  role: Role;
  phone: string | null;
};

export type ListingStatus = "draft" | "published" | "paused" | "sold";

export type Listing = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  status: ListingStatus;
  user_id: string | null;
};
