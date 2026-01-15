import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Permite +, espacios, guiones, paréntesis. Guardamos normalizado a dígitos (y + si venía).
function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  // Mantener + inicial si existe, y quitar lo demás salvo dígitos
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  // No limitar por país. Sólo un mínimo para evitar basura.
  if (digits.length < 7) return null;

  return (hasPlus ? "+" : "") + digits;
}

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;

  // Compat: por si el frontend manda diferentes nombres
  phone?: string;
  tel?: string;
  wa?: string;
  whatsapp?: string;

  honeypot?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[/api/leads] Missing env vars");
      return json(500, { ok: false, error: "Configuración incompleta del servidor" });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = (await req.json().catch(() => null)) as LeadPayload | null;
    if (!body) return json(400, { ok: false, error: "Body inválido" });

    const name = typeof body.name === "string" ? body.name.trim() : null;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const city = typeof body.city === "string" ? body.city.trim() : null;
    const role = typeof body.role === "string" ? body.role.trim() : null;

    const honeypot = typeof body.honeypot === "string" ? body.honeypot.trim() : null;
    if (honeypot) {
      // Antibots: fingimos OK y no guardamos
      return json(200, { ok: true, message: "Gracias, estás en la lista" });
    }

    if (!email || !emailRegex.test(email)) {
      return json(400, { ok: false, error: "Email inválido" });
    }

    const phoneRaw =
      body.phone ?? body.tel ?? body.wa ?? body.whatsapp ?? null;

    const phone = normalizePhone(phoneRaw);

    // Si se mandó un teléfono pero no pasa validación mínima → error
    const phoneWasProvided =
      typeof phoneRaw === "string" && phoneRaw.trim().length > 0;

    if (phoneWasProvided && !phone) {
      return json(400, { ok: false, error: "Teléfono inválido" });
    }

    const { error } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        city,
        role,
        phone,      // <- columna en DB: phone
        honeypot,   // <- por si quieres auditar, normalmente null
        // source: lo dejas por default 'landing'
      });

    if (error) {
      // Unique violation: Postgres code 23505
      const anyErr = error as any;
      const code = anyErr?.code;
      const msg = String(anyErr?.message ?? "");
      const details = String(anyErr?.details ?? "");

      if (code === "23505" || msg.includes("duplicate key") || details.includes("already exists")) {
        const hint = (details + " " + msg).toLowerCase();

        if (hint.includes("(email)") || hint.includes("email")) {
          return json(409, { ok: false, error: "Email ya registrado" });
        }
        if (hint.includes("(phone)") || hint.includes("phone") || hint.includes("tel")) {
          return json(409, { ok: false, error: "Teléfono ya registrado" });
        }
        // fallback genérico si no se identifica la columna
        return json(409, { ok: false, error: "Dato ya registrado" });
      }

      console.error("[/api/leads] insert error:", error);
      return json(500, { ok: false, error: "No se pudo guardar el lead" });
    }

    return json(200, { ok: true, message: "Gracias, estás en la lista" });
  } catch (e) {
    console.error("[/api/leads] unexpected error:", e);
    return json(500, { ok: false, error: "No se pudo guardar el lead" });
  }
}
