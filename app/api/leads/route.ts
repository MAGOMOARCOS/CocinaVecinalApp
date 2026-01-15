import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;
  wa?: string;
  honeypot?: string;

  // aliases por si el frontend cambia nombres
  interest?: string;
  whatsapp?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export async function POST(req: Request) {
  let payload: LeadPayload;

  try {
    payload = (await req.json()) as LeadPayload;
  } catch {
    return json(400, { ok: false, error: "JSON inválido" });
  }

  const honeypot = String(payload.honeypot || "").trim();
  if (honeypot) {
    // Bot -> fingimos ok para no dar señales
    return json(200, { ok: true, stored: false, message: "OK" });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const city = String(payload.city || "").trim();
  const role = String(payload.role || payload.interest || "").trim();
  const wa = String(payload.wa || payload.whatsapp || "").trim();

  if (!name || !email) return json(400, { ok: false, error: "Nombre y email son requeridos" });
  if (!emailRegex.test(email)) return json(400, { ok: false, error: "Email inválido" });

  // ENV: URL pública + SERVICE ROLE solo en servidor (recomendado para evitar líos con RLS)
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    return json(500, {
      ok: false,
      error:
        "Faltan variables de entorno. Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY",
    });
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Cambia este nombre si tu tabla se llama distinto
  const TABLE = "leads";

  try {
    // Upsert por email (requiere UNIQUE(email) en la tabla)
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        [
          {
            name,
            email,
            city: city || null,
            role: role || null,
            wa: wa || null,
            source: "landing",
          },
        ],
        { onConflict: "email" }
      );

    if (error) {
      console.error("[leads] Supabase error:", error);
      return json(500, { ok: false, error: "No se pudo guardar el lead" });
    }

    return json(200, {
      ok: true,
      stored: true,
      message: "Gracias, estás en la lista",
    });
  } catch (e) {
    console.error("[leads] Error inesperado:", e);
    return json(500, { ok: false, error: "Error inesperado" });
  }
}
