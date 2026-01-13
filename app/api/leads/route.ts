import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: any;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = String(payload?.name || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const city = String(payload?.city || "Medellín").trim() || "Medellín";
  const interest = String(payload?.interest || payload?.role || "Ambos").trim() || "Ambos";
  const whatsapp = String(payload?.whatsapp || payload?.wa || "").trim();
  const honeypot = String(payload?.honeypot || "").trim();

  if (honeypot) {
    // Silently ignore bots
    return NextResponse.json({ message: "ok" });
  }

  if (!name || !email) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const lead = {
    name,
    email,
    city,
    interest,
    whatsapp: whatsapp || null,
    created_at: new Date().toISOString(),
  };

  if (supabaseServer) {
    const { error } = await supabaseServer.from("leads").insert(lead);
    if (error) {
      console.error("Error guardando lead en Supabase", error);
      return NextResponse.json(
        { error: "No pudimos guardar tus datos ahora mismo. Intenta de nuevo." },
        { status: 500 }
      );
    }
  } else {
    console.log("Lead recibido (sin Supabase configurado):", lead);
  }

  return NextResponse.json({
    message: "¡Listo! Te avisaremos cuando lancemos en Medellín.",
  });
}

export function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}
