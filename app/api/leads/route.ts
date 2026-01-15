import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;

  // frontend puede mandar cualquiera de estos
  wa?: string;
  whatsapp?: string;
  phone?: string;

  honeypot?: string;
  interest?: string; // lo ignoramos (no existe columna)
};

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function normalizePhone(v: string) {
  const raw = v.trim();
  if (!raw) return null;

  // Deja solo dígitos y el + inicial (si existe)
  let s = raw.replace(/[^\d+]/g, "");
  // Si hay varios +, deja solo el primero
  if (s.includes("+")) {
    s = "+" + s.replace(/\+/g, "");
  }
  // Evita string vacío
  if (s === "+") return null;

  return s;
}

function duplicateMessageFromSupabaseError(err: any): string | null {
  // Postgres unique violation
  const code = err?.code;
  if (code !== "23505") return null;

  const msg = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.hint ?? ""}`.toLowerCase();

  // Nombres típicos del índice/constraint (según lo que crees en SQL)
  if (msg.includes("leads_email_unique") || msg.includes("email")) return "Email ya registrado";
  if (msg.includes("leads_phone_unique") || msg.includes("phone")) return "Teléfono ya registrado";

  // fallback
  return "Dato ya registrado";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;

    // Honeypot anti-bots: respondemos OK pero NO guardamos
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true, message: "OK" }, { status: 200 });
    }

    const name = (body.name ?? "").trim() || null;

    const emailRaw = (body.email ?? "").trim();
    const email = normalizeEmail(emailRaw);

    const city = (body.city ?? "").trim() || null;
    const role = (body.role ?? "").trim() || null;

    const phoneRaw = (body.wa ?? body.whatsapp ?? body.phone ?? "").trim();
    const phone = normalizePhone(phoneRaw);

    // Validación email
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("[/api/leads] Missing env vars", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(serviceKey),
      });
      return NextResponse.json(
        { ok: false, error: "Config servidor incompleta (env vars)" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from("leads").insert({
      email,        // NOT NULL
      name,
      city,
      role,
      phone,        // columna real en tabla
      source: "landing",
    });

    if (error) {
      // Si es duplicado, devolvemos 409 con el mensaje específico
      const dupMsg = duplicateMessageFromSupabaseError(error);
      if (dupMsg) {
        return NextResponse.json({ ok: false, error: dupMsg }, { status: 409 });
      }

      console.error("[/api/leads] supabase insert error:", error);
      return NextResponse.json({ ok: false, error: "No se pudo guardar el lead" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Gracias, estás en la lista" }, { status: 200 });
  } catch (e) {
    console.error("[/api/leads] unexpected error:", e);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el lead" }, { status: 500 });
  }
}
