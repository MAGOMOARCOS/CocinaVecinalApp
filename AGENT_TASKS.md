# AGENT_TASKS — Cocina Vecinal (MVP FUNCIONAL)

## Objetivo
Lanzar un MVP funcional de marketplace P2P de comida casera (piloto Medellín) con:
- exploración de platos
- publicación por cocineros
- pedido + pago real (retención/liberación)
- chat post-pago ligado al pedido para concretar entrega (picante/sin sal/alergias/hora/punto)
- modalidades: Recogida / Entrega (con radio) / Comer en casa
- privacidad: público = barrio/zona; dirección exacta solo post-pago

## Stack / Reglas técnicas (NO negociar)
- Next.js (App Router) + TypeScript
- /app como única fuente de rutas
- API solo en /app/api
- Deploy estable en Vercel (Node LTS)
- No duplicar rutas (no /my, no auth/page.tsx, etc.)
- UI consistente (dark + minimal)
- Nada de secretos en git (.env.local fuera)

## Estructura base (confirmada)
app/
├─ page.tsx
├─ listings/
│  ├─ page.tsx
│  ├─ new/page.tsx
│  └─ [id]/page.tsx
├─ dashboard/
│  └─ listings/page.tsx
├─ login/page.tsx
├─ api/
│  ├─ leads/route.ts
│  ├─ listings/route.ts
│  ├─ orders/route.ts
│  ├─ payments/route.ts
│  └─ webhooks/route.ts
└─ auth/
   └─ callback/route.ts

---

# STAGE 1 — Consolidar Landing (captación)
- [ ] Validar y reforzar formulario existente (nombre, email, ciudad, rol, teléfono opcional + repetir)
- [ ] Manejo de errores robusto (duplicados, validación, API down)
- [ ] Mensajería clara: “landing temporal”
DoD:
- "/" funciona estable
- POST /api/leads estable y sin duplicados

---

# STAGE 2 — MODELOS MVP (types + reglas)
## Datos mínimos de Listing (plato)
- id, title, description, price_cop
- modes:
  - mode_pickup:boolean
  - mode_delivery:boolean
  - mode_dine_in:boolean
- entrega:
  - delivery_radius_km:number|null (solo si mode_delivery)
  - delivery_fee_model:"flat"|"by_distance" (MVP: flat)
  - delivery_fee_flat_cop:number|null
- ubicación/privacidad:
  - area_public:string (barrio/zona visible)
  - address_exact_private:string|null (NO visible pre-pago)
- instrucciones:
  - pickup_instructions:string|null
  - dine_in_rules:string|null

DoD:
- Tipos/validaciones definidos y usados en UI y API
- Privacidad de dirección respetada

---

# STAGE 3 — Listado público de platos (explorar)
- [ ] /listings/page.tsx: listado + filtros por modalidad + precio
- [ ] Mostrar badges:
  - Recogida
  - Entrega (hasta X km)
  - Comer en casa (si aplica)
- [ ] /listings/[id]/page.tsx: detalle completo + CTA “Pedir”
- [ ] Antes de pagar:
  - mostrar area_public
  - NO mostrar address_exact_private

DoD:
- /listings no da 404
- lista → detalle OK
- dirección exacta nunca aparece pre-pago

---

# STAGE 4 — Publicar plato (cocinero)
- [ ] /listings/new/page.tsx: formulario completo del Listing
  - modalidades (checkboxes)
  - si Entrega: pedir radio (km) + tarifa flat (COP)
  - barrio/zona pública (area_public)
  - dirección exacta privada (address_exact_private) (guardada, pero no pública)
  - instrucciones (pickup_instructions / dine_in_rules)
- [ ] Guardar listing (mock o API real simple)

DoD:
- Crear listing estable
- Validación correcta
- No romper UI

---

# STAGE 5 — Dashboard cocinero (gestión)
- [ ] /dashboard/listings/page.tsx: listar “mis platos”
- [ ] acciones mínimas: activar/desactivar (MVP)
- [ ] acceso privado (auth real o mock, pero con guard)

DoD:
- Ruta privada consistente
- Gestión mínima operativa

---

# STAGE 6 — Pedidos + Pago real (NÚCLEO)
## Flujo
1) Comprador selecciona Listing
2) Crea pedido (order) con notas iniciales para cocinero
3) Checkout → pago real
4) Webhook PSP confirma pago → order.payment_status=PAID
5) Desde PAID:
   - se revela dirección exacta (si aplica)
   - chat ON

## Reglas
- Pago real es MVP core (no placeholder)
- Retención y liberación (MVP puede ser “manual release” admin si el PSP no soporta escrow total en v1)
- Cancelación ultra-corta (ventana breve) + reembolso en incidencias graves (manual/admin en v1)
- Privacidad:
  - dirección exacta solo post-pago

Tareas:
- [ ] /api/orders: crear pedido, listar pedidos del usuario
- [ ] /api/payments: iniciar checkout, devolver URL/intent
- [ ] /api/webhooks: procesar confirmación (pago OK)
- [ ] UI checkout (mínima) + pantalla pedido
- [ ] Guardar “Notas para el cocinero” en el pedido (pre-chat)

DoD:
- Existe orden con estados
- Pago confirmado por webhook cambia a PAID
- Tras PAID se habilita chat y se revela dirección exacta cuando proceda

---

# STAGE 7 — Chat post-pago (NÚCLEO OPERATIVO)
Condición: chat habilitado siempre que order.payment_status == PAID.

- [ ] Modelo messages:
  - id, order_id, sender_id, text, created_at
- [ ] Permisos: solo comprador y cocinero del order_id pueden leer/escribir
- [ ] UI chat dentro del detalle de pedido (texto-only)
- [ ] Plantillas rápidas:
  - 🌶️ Picante: …
  - 🧂 Sin sal
  - 🚫 Alergias: …
  - ⏰ Hora: …
  - 📍 Punto/Dirección exacta: …
  - ✅ Entregado
- [ ] El chat debe permitir “confirmación” operativa (ej. “Entregado”)

DoD:
- Pago confirmado ⇒ chat activo inmediato
- Mensajes rápidos funcionan y quedan registrados
- Nadie ajeno accede al chat

---

# STAGE 8 — Modalidades y reglas de entrega (UX + consistencia)
- [ ] En detalle del pedido:
  - Si Recogida: mostrar instrucciones genéricas + acordar por chat
  - Si Entrega: mostrar radio y tarifa; punto exacto por chat
  - Si Comer en casa: mostrar reglas y coordinar por chat
- [ ] Direcciones:
  - pre-pago: solo barrio/zona
  - post-pago: revelar exacta donde proceda

DoD:
- UX coherente con logística real
- Privacidad garantizada

---

# STAGE 9 — Legal mínimo (acceso público)
- [ ] Página o enlaces a:
  - Términos y Condiciones
  - Política de privacidad
- [ ] Registro/checkbox de aceptación en checkout (MVP)

DoD:
- No contradice el modelo operativo
- Trazabilidad de aceptación

---

# FUERA DE ALCANCE (MVP)
- Incentivos activos (BolsaX, Bote, Camino España) → solo “próximamente”
- Gamificación avanzada
- Notificaciones push perfectas (MVP: email o nada)
- Adjuntos en chat (fotos/audio)
- Moderación automática/IA
