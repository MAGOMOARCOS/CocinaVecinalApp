"use client";

import { useRef, useState, type FormEvent } from "react";

type LeadResponse = { ok?: boolean; message?: string; error?: string };

function normalizePhone(v: string) {
  if (!v) return "";
  // Mantiene dígitos y "+"; elimina espacios, guiones, etc.
  return v.trim().replace(/[^\d+]/g, "").slice(0, 32);
}

function digitsCount(v: string) {
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

    // Teléfono: opcional, pero si se usa → doble confirmación
    if (phone1 || phone2) {
      if (!phone1 || !phone2) {
        setErr("Repite el teléfono para confirmarlo");
        return;
      }
      if (phone1 !== phone2) {
        setErr("Los teléfonos no coinciden");
        return;
      }
      if (digitsCount(phone1) < 7) {
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
          phone: phone1 || null,
          honeypot,
        }),
      });

      let data: LeadResponse | null = null;
      try {
        data = (await response.json()) as LeadResponse;
      } catch {
        data = null;
      }

      if (response.ok && (data?.ok ?? true)) {
        setOk(data?.message ?? "Gracias, estás en la lista");
        form.reset();
        return;
      }

      setErr(data?.error ?? "Error al enviar el formulario");
    } catch {
      setErr("Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #0b0c10;
          --card: #12141b;
          --txt: #e9eefb;
          --muted: #aab3c5;
          --acc: #ff8a00;
          --ok: #39d98a;
          --err: #ff4d4d;
          --border: rgba(255, 255, 255, 0.12);
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          background: var(--bg);
          color: var(--txt);
        }
        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 28px 18px 60px;
        }
        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--acc);
          display: grid;
          place-items: center;
          color: #111;
          font-weight: 900;
        }
        .hero {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }
        .card {
          background: var(--card);
          border-radius: 18px;
          padding: 18px;
          border: 1px solid var(--border);
        }
        .title {
          font-size: 34px;
          line-height: 1.05;
          margin: 0 0 10px 0;
        }
        .muted {
          color: var(--muted);
        }
        .grid3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }
        @media (max-width: 860px) {
          .grid3 {
            grid-template-columns: 1fr;
          }
        }
        .mini {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
        }
        label {
          display: block;
          font-weight: 700;
          margin: 10px 0 6px;
        }
        input,
        select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #333;
          background: #0f1118;
          color: var(--txt);
          outline: none;
        }
        input:focus,
        select:focus {
          border-color: rgba(255, 138, 0, 0.7);
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 860px) {
          .row {
            grid-template-columns: 1fr;
          }
        }
        .primary {
          background: var(--acc);
          border: 0;
          border-radius: 12px;
          padding: 12px 14px;
          font-weight: 900;
          cursor: pointer;
          color: #111;
          width: 100%;
          margin-top: 10px;
        }
        .primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .ok {
          margin-top: 12px;
          color: var(--ok);
          font-weight: 900;
        }
        .err {
          margin-top: 12px;
          color: var(--err);
          font-weight: 900;
        }
        .btn {
          background: var(--acc);
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
          color: #111;
          white-space: nowrap;
        }
      `}</style>

      <div className="wrap">
        <div className="top">
          <div className="logo">CV</div>
          <button className="btn" onClick={scrollToForm}>
            Unirme a la lista
          </button>
        </div>

        <div className="hero">
          {/* IZQUIERDA */}
          <div className="card">
            <h1 className="title">Cocina Vecinal</h1>
            <p className="muted">
              Comida casera entre vecinos — Medellín primero. Si cocinas, puedes vender. Si no, puedes pedir.
            </p>

            <div className="grid3">
              <div className="mini">
                <strong>Recogida</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  Quedas con tu vecino y recoges.
                </div>
              </div>
              <div className="mini">
                <strong>Entrega</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  El cocinero entrega (tarifa por tramos).
                </div>
              </div>
              <div className="mini">
                <strong>Comer en casa</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  Opción anfitrión (si se habilita).
                </div>
              </div>
            </div>

            <p className="muted" style={{ marginTop: 14 }}>
              Esta landing es temporal para captación. Te avisamos al abrir. Sin spam.
            </p>
          </div>

          {/* DERECHA */}
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
              <input name="phone" placeholder="+57 300..." inputMode="tel" />

              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Si lo pones, repítelo igual para evitar errores. No limitamos por país.
              </div>

              <label>Repite teléfono</label>
              <input name="phone2" placeholder="+57 300..." inputMode="tel" />

              <input name="honeypot" style={{ display: "none" }} />

              <button className="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Apuntarme"}
              </button>

              {/* SOLO uno visible */}
              {message && !error && <div className="ok">{message}</div>}
              {error && <div className="err">{error}</div>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
