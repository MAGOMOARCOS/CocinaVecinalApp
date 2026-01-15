import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;

  // frontend puede mandar cualquiera de estos:
  wa?: string;
  whatsapp?: string;
  phone?: string;

  honeypot?: string;

  // alias “por si acaso” (no existe columna en tabla, se ignora)
  interest?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;

    // Honeypot anti-bots: si viene relleno, fingimos OK sin guardar.
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true, message: "OK" }, { status: 200 });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    const name = (body.name ?? "").trim() || null;
    const city = (body.city ?? "").trim() || null;
    const role = (body.role ?? "").trim() || null;

    // NORMALIZACIÓN: WhatsApp / phone (lo guardamos en columna 'phone')
    const phone =
      (body.wa ?? body.whatsapp ?? body.phone ?? "").trim() || null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !serviceKey) {
      console.error("[/api/leads] Missing env vars", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(serviceKey),
      });
      return NextResponse.json(
        { ok: false, error: "Configuración incompleta del servidor" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

    
    // IMPORTANTE: insertar SOLO columnas reales de la tabla 'leads'
    // y usar UPSERT por email para que pruebas repetidas no fallen.
    const { error } = await supabase
      .from("leads")
      .upsert(
        {
          email,          // NOT NULL
          name,
          city,
          role,
          phone,          // columna REAL en tabla
          source: "landing",
          // message es nullable: no hace falta
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("[/api/leads] supabase upsert error:", error);
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
