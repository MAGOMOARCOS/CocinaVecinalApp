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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;

    // honeypot anti-bots
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true, message: "OK" }, { status: 200 });
    }

    const name = (body.name ?? "").trim() || null;
    const email = (body.email ?? "").trim().toLowerCase();
    const city = (body.city ?? "").trim() || null;
    const role = (body.role ?? "").trim() || null;

    // NORMALIZACIÓN WhatsApp/phone
    const phone =
      (body.wa ?? body.whatsapp ?? body.phone ?? "").trim() || null;

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 👇 AQUÍ ESTÁ LA CLAVE: mapear a las columnas reales
    const { error } = await supabase.from("leads").insert({
      email,          // NOT NULL
      name,
      city,
      role,
      phone,          // columna real en tabla (no "wa")
      source: "landing",
      // message es nullable: no hace falta
    });

    if (error) {
      // Log útil para Vercel logs
      console.error("[/api/leads] supabase insert error:", error);
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
    console.error("[/api/leads] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el lead" },
      { status: 500 }
    );
  }
}
