import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabase = createClient(
  supabaseUrl,
  // En server: preferimos service role si existe; si no, anon (para no romper build)
  supabaseServiceKey || supabaseAnonKey
);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizePhoneToDigits(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  return digits;
}

function isValidEmail(email: string): boolean {
  // Regla simple suficiente
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function asRole(v: unknown): Role {
  const s = asString(v);
  if (s === "cocinero" || s === "cliente" || s === "admin") return s;
  return "cliente";
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json();

    if (!isRecord(bodyUnknown)) {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const name = asString(bodyUnknown.name).trim();
    const email = asString(bodyUnknown.email).trim().toLowerCase();
    const city = asString(bodyUnknown.city).trim();
    const role = asRole(bodyUnknown.role);

    const phoneRaw = asString(bodyUnknown.phone).trim();
    const phoneDigits = phoneRaw ? normalizePhoneToDigits(phoneRaw) : "";
    const phone = phoneDigits ? phoneDigits : null;

    if (!name || !email || !city) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (phoneDigits && phoneDigits.length < 7) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    // Duplicado por email
    const { data: existingByEmail, error: qEmailErr } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (qEmailErr) {
      console.error("leads email check error:", qEmailErr);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    if (existingByEmail && existingByEmail.length > 0) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    // Duplicado por teléfono (solo si hay)
    if (phone) {
      const { data: existingByPhone, error: qPhoneErr } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .limit(1);

      if (qPhoneErr) {
        console.error("leads phone check error:", qPhoneErr);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
      }

      if (existingByPhone && existingByPhone.length > 0) {
        return NextResponse.json({ error: "Teléfono ya registrado" }, { status: 409 });
      }
    }

    const { error: insErr } = await supabase.from("leads").insert({
      name,
      email,
      city,
      role,
      phone,
    });

    if (insErr) {
      console.error("leads insert error:", insErr);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    console.error("leads route fatal:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
