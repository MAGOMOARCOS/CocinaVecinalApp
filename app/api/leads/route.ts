import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Email simple (suficiente para landing)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Roles que llegan desde la LANDING (en español).
// OJO: NO mezclar esto con Role de “profiles” (cook/buyer/both).
type LeadRole = "cocinero" | "cliente" | "admin";

// Normaliza un string genérico
function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asLeadRole(v: unknown): LeadRole {
  const s = asString(v).trim().toLowerCase();
  if (s === "cocinero" || s === "cliente" || s === "admin") return s;
  return "cliente";
}

// Normaliza teléfono: deja dígitos y un "+" opcional al inicio
function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  const normalized = (hasPlus ? "+" : "") + digits;

  // Validación suave (no por país)
  if (digits.length < 6) return null;
  if (digits.length > 20) return null;

  return normalized;
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

type LeadPayload = {
  name?: unknown;
  email?: unknown;
  city?: unknown;
  role?: unknown;

  // teléfono puede llegar con distintos nombres según el front
  phone?: unknown;
  tel?: unknown;
  wa?: unknown;
  whatsapp?: unknown;

  // si existe “repite teléfono” en el front
  phoneRepeat?: unknown;
  telRepeat?: unknown;

  // honeypot anti-bots
  honeypot?: unknown;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as LeadPayload;

    // Honeypot: si viene relleno, fingimos OK para no dar pistas a bots
    const honeypot = asString(payload?.honeypot).trim();
    if (honeypot.length > 0) {
      return json(200, { ok: true, message: "Gracias, estás en la lista" });
    }

    const name = asString(payload.name).trim() || null;

    const emailRaw = asString(payload.email).trim().toLowerCase();
    if (!emailRaw || !emailRegex.test(emailRaw)) {
      return json(400, { ok: false, error: "Email inválido" });
    }

    const city = asString(payload.city).trim() || null;
    const role = asLeadRole(payload.role);

    // Soportamos varios alias del teléfono
    const phoneInputRaw =
      asString(payload.phone) ||
      asString(payload.tel) ||
      asString(payload.wa) ||
      asString(payload.whatsapp) ||
      "";

    const phoneInput = phoneInputRaw.trim() || null;
    const phone = normalizePhone(phoneInput);

    // Si el usuario escribió algo pero no pasa validación suave -> error claro
    if (phoneInput && !phone) {
      return json(400, {
        ok: false,
        error: "Teléfono inválido",
        hint:
          'Puedes escribirlo con o sin "+", con espacios o guiones. No limitamos por país.',
      });
    }

    // Si existe “repite teléfono”, comparamos (solo si ambos vienen)
    const phoneRepeatRaw =
      asString(payload.phoneRepeat) || asString(payload.telRepeat) || "";
    const phoneRepeatInput = phoneRepeatRaw.trim() || null;

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

    // INSERT explícito (lo que pedías)
    const { error } = await supabase.from("leads").insert({
      name,
      email: emailRaw,
      city,
      role, // "cocinero" | "cliente" | "admin"
      phone, // normalizado o null
      source: "landing",
    });

    if (error) {
      const pg = error as PostgrestError;

      // Unique violation (email o phone normalmente) → Postgres: 23505
      if (pg.code === "23505") {
        const text = (pg.message || "").toLowerCase();

        if (text.includes("email")) {
          return json(409, { ok: false, error: "Email ya registrado" });
        }
        if (text.includes("phone") || text.includes("tel")) {
          return json(409, { ok: false, error: "Teléfono ya registrado" });
        }

        return json(409, { ok: false, error: "Dato ya registrado" });
      }

      console.error("[/api/leads] insert error:", pg);
      return json(500, { ok: false, error: "No se pudo guardar el lead" });
    }

    return json(200, { ok: true, message: "Gracias, estás en la lista" });
  } catch (e) {
    console.error("[/api/leads] unexpected error:", e);
    return json(500, { ok: false, error: "No se pudo guardar el lead" });
  }
}
