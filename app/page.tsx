"use client";

import { useMemo, useState } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhoneForCompare(input: string): string {
  // Para comparar: nos quedamos con + (si existe al inicio) y dígitos
  const raw = input.trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  return (hasPlus ? "+" : "") + digits;
}

function isPhoneReasonable(input: string): boolean {
  const digits = input.replace(/[^\d]/g, "");
  // No limitar por país, solo mínimo razonable
  return digits.length === 0 || digits.length >= 7;
}

export default function Page() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Medellín");
  const [role, setRole] = useState("Ambos");

  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");

  // honeypot invisible (si quieres), lo dejamos como state por si lo añades
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    const e = email.trim();
    if (!e) return false;
    return emailRegex.test(e);
  }, [email]);

  const phoneProvided = useMemo(() => phone.trim().length > 0, [phone]);
  const phoneValid = useMemo(() => isPhoneReasonable(phone.trim()), [phone]);
  const phonesMatch = useMemo(() => {
    if (!phoneProvided) return true; // si no se usa, no exigimos match
    return normalizePhoneForCompare(phone) === normalizePhoneForCompare(phone2);
  }, [phone, phone2, phoneProvided]);

  function clearAlerts() {
    setMessage(null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAlerts();

    // Validaciones front claras
    if (!emailValid) {
      setError("Email inválido");
      return;
    }

    if (phoneProvided) {
      if (!phoneValid) {
        setError("Teléfono inválido");
        return;
      }
      if (!phonesMatch) {
        setError("Los teléfonos no coinciden");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim() || undefined,
        email: email.trim(),
        city: city.trim() || undefined,
        role: role || undefined,
        phone: phone.trim() || undefined,
        honeypot: honeypot || undefined,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok || !data?.ok) {
        const apiError = data?.error || "Error al enviar el formulario";
        setMessage(null);
        setError(String(apiError));
        return;
      }

      setError(null);
      setMessage(String(data?.message || "Gracias, estás en la lista"));

      // Limpieza de campos tras OK
      setName("");
      setEmail("");
      setCity("Medellín");
      setRole("Ambos");
      setPhone("");
      setPhone2("");
      setHoneypot("");
    } catch (err) {
      setMessage(null);
      setError("Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center font-black">
              cv
            </div>
            <div>
              <div className="text-xl font-semibold">Cocina Vecinal</div>
              <div className="text-sm text-white/70">
                Comida casera entre vecinos — Medellín primero
              </div>
            </div>
          </div>

          <a
            href="#form"
            className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-black hover:opacity-90"
          >
            Unirme a la lista
          </a>
        </div>

        {/* Content */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT */}
          <section className="rounded-3xl bg-white/5 p-8 shadow-xl shadow-black/30 border border-white/10">
            <h1 className="text-5xl leading-[1.05] font-semibold">
              Si cocinas en casa, puedes vender.{" "}
              <span className="text-white/80">
                Si no te apetece cocinar, puedes pedir.
              </span>
            </h1>

            <p className="mt-6 text-lg text-white/70">
              Cocina Vecinal conecta <b className="text-white">cocinas caseras</b> con vecinos que quieren{" "}
              <b className="text-white">comida asequible y real</b>. Cada persona puede ser{" "}
              <b className="text-white">oferta</b> y <b className="text-white">demanda</b> según el día.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-lg font-semibold">Recogida</div>
                <div className="mt-2 text-sm text-white/70">
                  Quedas con tu vecino y recoges.
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-lg font-semibold">Entrega</div>
                <div className="mt-2 text-sm text-white/70">
                  El cocinero entrega (tarifa por tramos).
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-lg font-semibold">Comer en casa</div>
                <div className="mt-2 text-sm text-white/70">
                  Opción “anfitrión” (si el cocinero la habilita).
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#form"
                className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-black hover:opacity-90"
              >
                Unirme a la lista de espera
              </a>

              <a
                href="mailto:info@cocinavecinal.com"
                className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/5"
              >
                Contactar
              </a>
            </div>

            <div className="mt-8 text-sm text-white/60">
              <div className="font-semibold text-white/70">Nota:</div>
              esto es una página temporal para captación y validación. La app se lanza en ~90 días.
              <div className="mt-3">
                <a className="underline" href="mailto:info@cocinavecinal.com">
                  info@cocinavecinal.com
                </a>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section
            id="form"
            className="rounded-3xl bg-white/5 p-8 shadow-xl shadow-black/30 border border-white/10"
          >
            <div className="inline-flex rounded-full bg-orange-200 px-4 py-2 text-sm font-semibold text-black">
              Lista de espera (pre-lanzamiento)
            </div>

            <h2 className="mt-4 text-2xl font-semibold">Únete a la lista de espera</h2>
            <p className="mt-2 text-white/70">
              Te avisaremos cuando abramos en Medellín. <br />
              (Sin spam)
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {/* honeypot (oculto) */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      clearAlerts();
                      setName(e.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    value={email}
                    onChange={(e) => {
                      clearAlerts();
                      setEmail(e.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                    placeholder="tu@email.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">Ciudad</label>
                  <input
                    value={city}
                    onChange={(e) => {
                      clearAlerts();
                      setCity(e.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                    placeholder="Medellín"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Me interesa como</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      clearAlerts();
                      setRole(e.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  >
                    <option>Ambos</option>
                    <option>Cocinero</option>
                    <option>Cliente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Teléfono (opcional)</label>
                <input
                  value={phone}
                  onChange={(e) => {
                    clearAlerts();
                    setPhone(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="+57 300..."
                  inputMode="tel"
                  autoComplete="tel"
                />
                <div className="mt-2 text-xs text-white/60">
                  Puedes escribirlo con o sin “+”, con espacios o guiones. No limitamos por país.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Repite teléfono</label>
                <input
                  value={phone2}
                  onChange={(e) => {
                    clearAlerts();
                    setPhone2(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="+57 300..."
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <button
                disabled={isSubmitting}
                className="mt-2 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-black hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Apuntarme"}
              </button>

              {/* Alerts */}
              {message && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 font-semibold text-emerald-200">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-semibold text-red-300">
                  {error}
                </div>
              )}

              <div className="text-sm text-white/60">
                Tus datos se guardarán de forma segura.
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
