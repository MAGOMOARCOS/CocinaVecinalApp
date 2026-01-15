"use client";

import React, { useMemo, useRef, useState } from "react";

type ApiResponse =
  | { ok: true; message: string }
  | { ok: false; error: string };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Teléfono: permitimos +, espacios, guiones, paréntesis.
// Validamos por cantidad mínima de dígitos para evitar basura.
// NO limitamos por país.
function phoneDigitsCount(phone: string): number {
  return phone.replace(/[^\d]/g, "").length;
}

function normalizeTrim(v: string): string {
  return v.trim().replace(/\s+/g, " ");
}

export default function Page() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Medellín");
  const [role, setRole] = useState("Ambos");

  // Teléfono (opcional) + confirmación
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");

  // Estado UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Honeypot (anti-bots)
  const [honey, setHoney] = useState("");

  const validationError = useMemo(() => {
    const n = normalizeTrim(name);
    const e = email.trim();
    const c = normalizeTrim(city);

    if (n.length > 0 && n.length < 2) return "Nombre demasiado corto";
    if (!e) return "Email requerido";
    if (!emailRegex.test(e)) return "Email inválido";
    if (!c) return "Ciudad requerida";

    const p = phone.trim();
    const p2 = phone2.trim();

    // Si NO hay teléfono: ok (no pedimos confirmación)
    if (!p) return null;

    // Si hay teléfono: pedimos confirmación y validamos mínimo de dígitos
    const digits = phoneDigitsCount(p);
    if (digits < 7) return "Teléfono inválido (demasiado corto)";
    if (!p2) return "Repite teléfono";
    if (p2 !== p) return "Los teléfonos no coinciden";

    // Si hay confirmación, validamos también que no sea basura
    const digits2 = phoneDigitsCount(p2);
    if (digits2 < 7) return "Teléfono inválido (demasiado corto)";

    return null;
  }, [name, email, city, phone, phone2]);

  function clearFeedback() {
    setMessage(null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();

    const vErr = validationError;
    if (vErr) {
      setError(vErr);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: normalizeTrim(name) || null,
        email: email.trim(),
        city: normalizeTrim(city) || null,
        role,
        phone: phone.trim() || null,
        phone2: phone2.trim() || null, // el server puede ignorarlo; lo mando por robustez
        honey, // honeypot
      };

      const resp = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await resp.json()) as ApiResponse;

      if (!resp.ok || !data.ok) {
        const msg = !data.ok ? data.error : "No se pudo guardar el lead";
        setMessage(null);
        setError(msg);
        return;
      }

      // OK
      setError(null);
      setMessage(data.message || "Gracias, estás en la lista");

      // opcional: limpiar campos (email lo puedes dejar si prefieres)
      // setName("");
      // setEmail("");
      // setCity("Medellín");
      // setRole("Ambos");
      // setPhone("");
      // setPhone2("");
      // setHoney("");
    } catch (err) {
      setMessage(null);
      setError("Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/90 text-black font-bold grid place-items-center">
            cv
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold">Cocina Vecinal</div>
            <div className="text-sm text-white/70">
              Comida casera entre vecinos — Medellín primero
            </div>
          </div>
        </div>

        <button
          onClick={scrollToForm}
          className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-black hover:bg-orange-400 transition"
        >
          Unirme a la lista
        </button>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-16 lg:grid-cols-2">
        {/* Left side */}
        <section className="rounded-3xl bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <h1 className="text-4xl font-semibold leading-tight">
            Si cocinas en casa, puedes vender. Si no te apetece cocinar, puedes pedir.
          </h1>

          <p className="mt-5 text-white/75">
            Cocina Vecinal conecta <span className="font-semibold text-white">cocinas caseras</span> con vecinos
            que quieren <span className="font-semibold text-white">comida asequible y real</span>. Cada persona
            puede ser <span className="font-semibold text-white">oferta y demanda</span> según el día.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-lg font-semibold">Recogida</div>
              <div className="mt-2 text-sm text-white/70">Quedas con tu vecino y recoges.</div>
            </div>

            <div className="rounded-2xl bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-lg font-semibold">Entrega</div>
              <div className="mt-2 text-sm text-white/70">El cocinero entrega (tarifa por tramos).</div>
            </div>

            <div className="rounded-2xl bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-lg font-semibold">Comer en casa</div>
              <div className="mt-2 text-sm text-white/70">
                Opción “anfitrión” (si el cocinero la habilita).
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={scrollToForm}
              className="rounded-2xl bg-orange-500 px-6 py-4 font-semibold text-black hover:bg-orange-400 transition"
            >
              Unirme a la lista de espera
            </button>

            <a
              href="mailto:info@cocinavecinal.com"
              className="rounded-2xl bg-white/5 px-6 py-4 font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/10 transition"
            >
              Contactar
            </a>
          </div>

          <div className="mt-6 text-sm text-white/60">
            Nota: esta es una página temporal para captación y validación.
            <br />
            info@cocinavecinal.com
          </div>
        </section>

        {/* Right side: form */}
        <section
          ref={formRef}
          className="rounded-3xl bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <div className="text-sm text-white/70">Únete a la lista de espera</div>
          <div className="mt-1 text-white/70 text-sm">Te avisaremos cuando abramos en Medellín. (Sin spam)</div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            {/* Honeypot hidden */}
            <input
              value={honey}
              onChange={(e) => setHoney(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Limpieza suave: si había error de validación, lo borramos al tocar
                    if (error) setError(null);
                    if (message) setMessage(null);
                  }}
                  placeholder="Tu nombre"
                  className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">Email</label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                    if (message) setMessage(null);
                  }}
                  placeholder="tu@email.com"
                  className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">Ciudad</label>
                <input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (error) setError(null);
                    if (message) setMessage(null);
                  }}
                  placeholder="Medellín"
                  className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">Me interesa como</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (error) setError(null);
                    if (message) setMessage(null);
                  }}
                  className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
                >
                  <option value="Ambos">Ambos</option>
                  <option value="Cocinero">Cocinero</option>
                  <option value="Comprador">Comprador</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">Teléfono (opcional)</label>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError(null);
                  if (message) setMessage(null);
                }}
                placeholder="+57 300..."
                className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
              />
              <div className="mt-2 text-xs text-white/60">
                Puedes escribirlo con o sin “+”, con espacios o guiones. No limitamos por país.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">Repite teléfono</label>
              <input
                value={phone2}
                onChange={(e) => {
                  setPhone2(e.target.value);
                  if (error) setError(null);
                  if (message) setMessage(null);
                }}
                placeholder="+57 300..."
                className="mt-2 w-full rounded-2xl bg-black/40 px-4 py-3 text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.10)] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.70)]"
              />
<div className="mt-2 text-xs text-white/60">
  Si no pones teléfono, este campo se ignora. Si lo pones, debe coincidir.
</div>
