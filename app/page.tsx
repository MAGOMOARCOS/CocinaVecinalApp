"use client";

import { useRef, useState, type FormEvent } from "react";

type LeadResponse = { ok?: boolean; message?: string; error?: string };

function normalizePhone(v: string) {
  if (!v) return "";
  // Mantiene dígitos y "+"; elimina espacios, guiones, paréntesis, etc.
  return v.trim().replace(/[^\d+]/g, "").slice(0, 32);
}

function countDigits(v: string) {
  return v.replace(/\D/g, "").length;
}

export default function Home() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setOk(msg: string) {
    setError(null);
    setMessage(msg);
  }

  function setErr(msg: string) {
    setMessage(null);
    setError(msg);
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    // Limpia estados al comenzar
    setMessage(null);
    setError(null);

    const form = e.currentTarget;

    // Validación HTML5 básica
    if (!form.reportValidity()) {
      setErr("Revisa los campos marcados.");
      return;
    }

    const fd = new FormData(form);

    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const city = (String(fd.get("city") || "").trim() || "Medellín").trim();
    const role = String(fd.get("role") || "Ambos");

    // Teléfono (opcional) + confirmación
    const phone1 = normalizePhone(String(fd.get("phone") || ""));
    const phone2 = normalizePhone(String(fd.get("phone2") || ""));

    const honeypot = String(fd.get("honeypot") || "").trim();

    // Anti-bot silencioso
    if (honeypot) {
      setOk("Gracias, estás en la lista");
      form.reset();
      return;
    }

    // Validaciones claras
    if (!name || !email) {
      setErr("Nombre y email son obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("Email inválido");
      return;
    }

    // Teléfono: opcional. Si se usa, exige doble confirmación y mínimo de dígitos.
    const anyPhone = !!(phone1 || phone2);
    if (anyPhone) {
      if (!phone1 || !phone2) {
        setErr("Repite el teléfono para confirmarlo");
        return;
      }
      if (phone1 !== phone2) {
        setErr("Los teléfonos no coinciden");
        return;
      }

      // Validación mínima sin atarte a país:
      // - al menos 6 dígitos (evita basura tipo "12" o "+")
      // - máximo ya lo corta normalizePhone (32 chars)
      if (countDigits(phone1) < 6) {
        setErr("Teléfono inválido");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          city,
          role,
          phone: phone1 || undefined,
          honeypot,
        }),
      });

      let data: LeadResponse | null = null;
      try {
        data = (await response.json()) as LeadResponse;
      } catch {
        data = null;
      }

      // OK
      if (response.ok && (data?.ok ?? true)) {
        setOk(data?.message ?? "Gracias, estás en la lista");
        form.reset();
        return;
      }

      // Error controlado
      setErr(data?.error ?? "Error al enviar el formulario");
    } catch {
      setErr("Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* === estilos intactos (solo mínimos para ok/err) === */}
      <style jsx global>{`
        :root{--bg:#0b0c10;--card:#12141b;--txt:#e9eefb;--muted:#aab3c5;--acc:#ff8a00;--ok:#39d98a}
        *{box-sizing:border-box}
        body{margin:0;font-family:system-ui;background:#0b0c10;color:var(--txt)}
        .wrap{max-width:980px;margin:0 auto;padding:28px 18px 60px}
        .top{display:flex;justify-content:space-between;align-items:center}
        .logo{width:42px;height:42px;border-radius:12px;background:var(--acc);display:grid;place-items:center;color:#111;font-weight:900}
        .hero{margin-top:18px;display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
        @media(max-width:860px){.hero{grid-template-columns:1fr}}
        .card{background:#12141b;border-radius:18px;padding:18px}
        label{display:block;font-weight:700;margin:10px 0 6px}
        input,select{width:100%;padding:12px;border-radius:12px;border:1px solid #333;background:#0f1118;color:var(--txt)}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:860px){.row{grid-template-columns:1fr}}
        .primary{background:var(--acc);border:0;border-radius:12px;padding:12px 14px;font-weight:800;cursor:pointer}
        .ok{margin-top:10px;color:var(--ok);font-weight:800}
        .err{margin-top:10px;color:#ff4d4d;font-weight:800}
      `}</style>

      <div className="wrap">
        <div className="top">
          <div className="logo">CV</div>
          <button className="primary" onClick={scrollToForm}>
            Unirme a la lista
          </button>
        </div>

        <div className="hero">
          <div className="card">
            <h1>Cocina Vecinal</h1>
            <p>Comida casera entre vecinos — Medellín primero</p>
          </div>

          <div className="card" ref={formRef}>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div>
                  <label>Nombre</label>
                  <input name="name" required />
                </div>
                <div>
                  <label>Email</label>
                  <input name="email" type="email" required />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Ciudad</label>
                  <input name="city" placeholder="Medellín" />
                </div>
                <div>
                  <label>Me interesa como</label>
                  <select name="role" defaultValue="Ambos">
                    <option value="Consumidor">Consumidor</option>
                    <option value="Cocinero">Cocinero</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>
              </div>

              <label>Teléfono (opcional)</label>
              <input name="phone" placeholder="+57 300…" inputMode="tel" />

              <label>Repite teléfono</label>
              <input name="phone2" placeholder="+57 300…" inputMode="tel" />

              {/* honeypot */}
              <input name="honeypot" style={{ display: "none" }} />

              <button className="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando…" : "Apuntarme"}
              </button>

              {/* IMPORTANTe: nunca ambos a la vez */}
              {message && !error && <div className="ok">{message}</div>}
              {error && !message && <div className="err">{error}</div>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
