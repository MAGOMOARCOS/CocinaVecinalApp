import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Email simple (suficiente para landing)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normaliza teléfono: deja dígitos y un "+" opcional al inicio
function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  // Permite +, espacios, guiones, paréntesis y puntos en entrada, pero guarda normalizado
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  const normalized = (hasPlus ? "+" : "") + digits;

  // Validación suave (no por país): evita basura extrema
  // (si quieres aún más suave, quita estos límites)
  if (digits.length < 6) return null;   // demasiado corto para ser útil
  if (digits.length > 20) return null;  // demasiado largo
  return normalized;
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

type LeadPayload = {
  name?: string;
  email?: string;
  city?: string;
  role?: string;

  // teléfono puede llegar con distintos nombres según el front
  phone?: string;
  tel?: string;
  wa?: string;
  whatsapp?: string;

  // si añadiste “repite teléfono” en el front
  phoneRepeat?: string;
  telRepeat?: string;

  // honeypot anti-bots
  honeypot?: string;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as LeadPayload;

    // Honeypot: si viene relleno, fingimos OK para no dar pistas a bots
    if (payload?.honeypot && String(payload.honeypot).trim().length > 0) {
      return json(200, { ok: true, message: "Gracias, estás en la lista" });
    }

    const name = (payload.name ?? "").trim() || null;

    const emailRaw = (payload.email ?? "").trim().toLowerCase();
    if (!emailRaw || !emailRegex.test(emailRaw)) {
      return json(400, { ok: false, error: "Email inválido" });
    }

    const city = (payload.city ?? "").trim() || null;
    const role = (payload.role ?? "").trim() || null;

    // Soportamos varios alias que tu front pudo usar antes (wa/whatsapp/etc.)
    const phoneInput =
      payload.phone ?? payload.tel ?? payload.wa ?? payload.whatsapp ?? null;

    const phone = normalizePhone(phoneInput);

    // Si el usuario escribió algo pero no pasa validación suave -> error claro
    if (phoneInput && String(phoneInput).trim() !== "" && !phone) {
      return json(400, {
        ok: false,
        error: "Teléfono inválido",
        hint: 'Puedes escribirlo con o sin "+", con espacios o guiones. No limitamos por país.',
      });
    }

    // Si existe “repite teléfono”, lo comparamos (solo si ambos vienen)
    const phoneRepeatInput =
      payload.phoneRepeat ?? payload.telRepeat ?? null;

    if (phoneInput && phoneRepeatInput) {
      const p1 = normalizePhone(phoneInput);
      const p2 = normalizePhone(phoneRepeatInput);
      if (!p1 || !p2) {
        return json(400, { ok: false, error: "Teléfono inválido" });
      }
      if (p1 !== p2) {
        return json(400, { ok: false, error: "Los teléfonos no coinciden" });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[/api/leads] Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasService: !!serviceRoleKey,
      });
      return json(500, { ok: false, error: "Servidor no configurado" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 👇 AQUÍ está el INSERT real (lo que pedías)
    const { error } = await supabase.from("leads").insert({
      name,
      email: emailRaw,
      city,
      role,
      phone,           // guardamos teléfono normalizado (o null)
      source: "landing",
    });

    if (error) {
      // Unique violation (email o phone normalmente)
      // Postgres: 23505
      const code = (error as any).code as string | undefined;
      const msg = (error as any).message as string | undefined;

      // Intentamos detectar si el duplicado fue email o phone por el texto del error/constraint
      if (code === "23505") {
        const text = `${msg ?? ""}`.toLowerCase();

        if (text.includes("email")) {
          return json(409, { ok: false, error: "Email ya registrado" });
        }
        if (text.includes("phone") || text.includes("tel")) {
          return json(409, { ok: false, error: "Teléfono ya registrado" });
        }

        // Fallback si no podemos saber cuál
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
