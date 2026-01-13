import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;
  wa?: string;
  honeypot?: string;
  interest?: string;
  whatsapp?: string;
};

export async function POST(req: Request) {
  let payload: LeadPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "JSON inválido" },
      { status: 400 }
    );
  }

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const city = (payload.city ?? "").trim() || "Medellín";
  const role = (payload.role ?? payload.interest ?? "Ambos").trim() || "Ambos";
  const wa = (payload.wa ?? payload.whatsapp ?? "").trim();
  const honeypot = (payload.honeypot ?? "").trim();

  if (honeypot) {
    return NextResponse.json(
      { ok: false, message: "Solicitud no válida" },
      { status: 400 }
    );
  }

  if (!name || !email) {
    return NextResponse.json(
      { ok: false, message: "Nombre y email son requeridos" },
      { status: 400 }
    );
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Email inválido" },
      { status: 400 }
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "[leads] Falta configuración de Supabase. Guarda en fallback."
    );
    return NextResponse.json({
      ok: true,
      stored: false,
      message: "capturado pero no guardado: falta config",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      city,
      role,
      whatsapp: wa,
    });

    if (error) {
      console.error("[leads] Error al guardar lead", error);
      return NextResponse.json({
        ok: true,
        stored: false,
        message: "capturado pero no guardado: falta config",
      });
    }

    return NextResponse.json({
      ok: true,
      stored: true,
      message: "Gracias, estás en la lista",
    });
  } catch (error) {
    console.error("[leads] Error inesperado", error);
    return NextResponse.json(
      { ok: false, message: "Error inesperado" },
      { status: 500 }
    );
  }
}
