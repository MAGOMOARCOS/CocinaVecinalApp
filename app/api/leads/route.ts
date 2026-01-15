import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;
  wa?: string; // WhatsApp (frontend)
  honeypot?: string;

  // aliases por si el frontend cambia nombres
  whatsapp?: string;
  phone?: string;
  interest?: string;
};

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SERVICE_ROLE =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json(500, {
        ok: false,
        error:
          "Faltan variables de entorno de Supabase (URL o SERVICE_ROLE_KEY).",
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    let payload: LeadPayload | null = null;
    try {
      payload = (await req.json()) as LeadPayload;
    } catch {
      return json(400, { ok: false, error: "Body JSON inválido." });
    }

    const name = String(payload?.name ?? "").trim();
    const email = String(payload?.email ?? "").trim();
    const city = String(payload?.city ?? "").trim() || "Medellín";

    // role puede venir como role o interest
    const role = String(payload?.role ?? payload?.interest ?? "Ambos").trim();

    // WhatsApp puede venir como wa / whatsapp / phone
    const phone = String(payload?.wa ?? payload?.whatsapp ?? payload?.phone ?? "")
      .trim();

    const honeypot = String(payload?.honeypot ?? "").trim();

    // Anti-bot: si honeypot viene relleno, respondemos ok sin guardar.
    if (honeypot) {
      return json(200, { ok: true, message: "Gracias, estás en la lista" });
    }

    if (!name || !email) {
      return json(400, { ok: false, error: "Nombre y email son requeridos." });
    }

    if (!emailRegex.test(email)) {
      return json(400, { ok: false, error: "Email inválido." });
    }

    // Inserción: ajusta nombres a tu tabla real (según tu captura: email, name, city, role, phone, source)
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      city,
      role,
      phone: phone || null,
      source: "landing",
    });

    if (error) {
      // Si tienes unique constraint en email, normalmente será 23505
      const code = (error as any).code;
      if (code === "23505") {
        return json(200, {
          ok: true,
          message: "Ya estabas en la lista 🙂",
        });
      }

      return json(500, {
        ok: false,
        error: `Supabase insert error: ${error.message}`,
      });
    }

    return json(200, { ok: true, message: "Gracias, estás en la lista" });
  } catch (e: any) {
    return json(500, {
      ok: false,
      error: e?.message ? `Error servidor: ${e.message}` : "Error servidor.",
    });
  }
}
