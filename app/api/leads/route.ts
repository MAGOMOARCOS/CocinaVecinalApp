import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;

  // teléfono (lo importante)
  phone?: string;

  // compatibilidad con versiones anteriores del frontend
  wa?: string;
  whatsapp?: string;

  // honeypot antispam
  honeypot?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(v?: string, max = 200) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function normalizePhone(v?: string) {
  if (!v) return null;
  const raw = String(v).trim();
  if (!raw) return null;

  // Permitimos +, espacios, guiones, paréntesis, puntos.
  // Guardamos “limpio” para comparar y evitar basura.
  const cleaned = raw.replace(/[^\d+]/g, "");
  // Evita cosas absurdas como "++++"
  const plusFixed = cleaned.startsWith("+")
    ? "+" + cleaned.slice(1).replace(/\+/g, "")
    : cleaned.replace(/\+/g, "");

  // No imponemos longitud estricta (por expansión internacional),
  // pero sí evitamos strings ridículas vacías o de 1 dígito.
  const digits = plusFixed.replace(/\D/g, "");
  if (digits.length < 6) return null;

  // Límite razonable de almacenamiento
  return plusFixed.slice(0, 32);
}

function mapUniqueErrorToMessage(err: any) {
  // Postgres unique violation
  const code = err?.code || err?.details || err?.hint || "";
  const msg = `${err?.message || ""} ${err?.details || ""} ${err?.hint || ""}`.toLowerCase();

  if (String(code).includes("23505") || msg.includes("duplicate key")) {
    if (msg.includes("email")) return "Email ya registrado";
    if (msg.includes("phone")) return "Teléfono ya registrado";
    // fallback
    return "Dato ya registrado";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as LeadPayload;

    // Honeypot: si viene relleno, fingimos OK (para bots) y no guardamos nada
    const honeypot = normalizeText(payload.honeypot, 200);
    if (honeypot) {
      return NextResponse.json({ ok: true, message: "Gracias, estás en la lista" }, { status: 200 });
    }

    const email = normalizeText(payload.email, 254);
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const name = normalizeText(payload.name, 120);
    const city = normalizeText(payload.city, 120);
    const role = normalizeText(payload.role, 40);

    // Teléfono: prioridad phone, si no, wa/whatsapp
    const phone = normalizePhone(payload.phone || payload.wa || payload.whatsapp);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Faltan variables de entorno de Supabase en el servidor" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Insert directo a la tabla leads
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      city,
      role,
      phone,
      source: "landing",
    });

    if (error) {
      const friendly = mapUniqueErrorToMessage(error);
      if (friendly) {
        return NextResponse.json({ ok: false, error: friendly }, { status: 409 });
      }

      return NextResponse.json(
        { ok: false, error: "No se pudo guardar el lead" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, message: "Gracias, estás en la lista" },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Error al enviar el formulario" }, { status: 500 });
  }
}
