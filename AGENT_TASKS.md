

⚠️ NOTE:
Todo el contenido anterior a este punto se considera **DEPRECATED**.
El agente debe ejecutar **exclusivamente** las tareas definidas como `TASK 00X` a partir de aquí.



OBJETIVO PRIORITARIO (NO DIVAGAR):

1. Arreglar definitivamente app/page.tsx para que:
   - npm run build pase en Vercel
   - no haya errores de “Expected a semicolon”
   - handleSubmit tenga try/catch/finally bien cerrados

2. Verificar localmente con npm run build.

3. Si hay cambios:
   - crear rama agent/codex-*
   - commit
   - abrir Pull Request automáticamente.

No modificar agent.yml.
No tocar otros archivos si no es estrictamente necesario.


## TAREA PRIORITARIA (BUILD ESTABLE)
1) Ejecuta `npm install` para regenerar/actualizar `package-lock.json` y dejarlo 100% sincronizado con `package.json`.
2) Asegura que `npm run build` pasa en limpio.
3) NO modifiques nada dentro de `.github/workflows/` (ni lo crees, ni lo edites).
4) Commit separado: "chore: sync package-lock and fix build"

@codex Arregla el build que falla en Vercel (module not found tipo "@/lib/supabaseClient").
Haz commits en esta rama hasta dejar `npm run build` en verde. Cambios mínimos.

# Instrucciones del agente

1. Verificar que exista carpeta `/app` con `layout.tsx` y `page.tsx`.
2. Crear `/lib/supabaseClient.ts` con la conexión al proyecto Supabase.
3. Comprobar `/auth/callback/page.tsx` y corregir importación de `@/lib/supabaseClient`.
4. Añadir carpeta `/components` con:
   - `Header.tsx`
   - `Footer.tsx`
   - `Loader.tsx`
5. Crear `/styles/globals.css` con Tailwind correctamente importado.
6. Revisar `/package.json` y dependencias necesarias:
   - `next`
   - `react`
   - `react-dom`
   - `@supabase/supabase-js`
   - `tailwindcss`
   - `postcss`
   - `autoprefixer`
7. Ejecutar `npm run build` y asegurar que no hay errores.
8. Configurar deploy automático en Vercel.
## NEXT (prioridad alta) — continuar con el agente

### 1) Limpieza del repo (evitar duplicados)
- Verificar que NO existen carpetas duplicadas tipo `CocinaVecinalApp-main/` ni archivos espejo `page.tsx` fuera de `app/`.
- Si existen, eliminarlos y actualizar imports/rutas para que solo quede una fuente de verdad:
  - UI: `app/page.tsx`
  - API: `app/api/leads/route.ts`

### 2) Formulario: teléfono (no WhatsApp) + validación
- En UI, el campo debe llamarse “Teléfono (opcional)” (no WhatsApp).
- Añadir “Repite teléfono” y validar:
  - Si uno está relleno, el otro debe estar relleno.
  - Deben coincidir tras normalizar (quitar espacios, guiones, paréntesis).
  - No limitar por país (permitir +, espacios y guiones).
- Si no coincide: mostrar error claro y NO enviar.

### 3) Mensajería limpia (no mostrar éxito y error a la vez)
- Unificar el estado del formulario: `status = 'idle' | 'success' | 'error'`.
- Garantizar que nunca se rendericen simultáneamente el “Gracias…” y “Error…”.
- Si la API devuelve `{ ok:false, error:'Email ya registrado' }` o `{ ok:false, error:'Teléfono ya registrado' }`, mostrar exactamente eso.

### 4) API /api/leads robusta e idempotente
- En `app/api/leads/route.ts`:
  - Validar email con regex y devolver 400 si es inválido.
  - Aceptar `phone` opcional (string) y normalizarlo.
  - Insertar en tabla `leads` con `.insert({ name, email, city, role, phone })`.
  - Manejar violaciones de UNIQUE:
    - Email duplicado => 409 con `Email ya registrado`
    - Teléfono duplicado => 409 con `Teléfono ya registrado`
  - Si todo ok => 200 con `Gracias, estás en la lista`
- No usar `service_role` en frontend. Solo en server.

### 5) Build y deploy
- Ejecutar `npm ci` y `npm run build`.
- Si compila, abrir PR con cambios y descripción breve del fix.
## NEXT (ejecutar)

@codex
1) Verifica que la landing funciona end-to-end en producción:
   - envío OK → inserta en Supabase
   - email duplicado → mensaje “Email ya registrado”
   - teléfono duplicado → mensaje “Teléfono ya registrado”
   - email inválido → error claro (no envía)
   - teléfono y “repite teléfono” no coinciden → error claro (no envía)

2) Limpieza UI/estado en app/page.tsx:
   - Garantiza que NUNCA se muestren a la vez success y error (mutuamente excluyentes).
   - Unifica el manejo de errores (un solo punto donde se decide el mensaje).
   - Tras success: opcionalmente limpia campos (excepto ciudad/rol si quieres mantenerlos).

3) Validación de teléfono:
   - Teléfono es opcional.
   - Si se rellena, exigir “repite teléfono” y que coincida.
   - Aceptar +, espacios, guiones y números; normalizar a solo dígitos para comparar/guardar.
   - No imponer longitud por país (solo un mínimo razonable: >= 7 dígitos).

4) Backend /api/leads (route.ts):
   - Asegura insert explícito con los campos actuales: name, email, city, role, phone
   - Normaliza phone en backend igual que en frontend.
   - Maneja duplicados devolviendo status 409 y mensaje exacto:
       - “Email ya registrado”
       - “Teléfono ya registrado”
   - Log interno (console.error) pero NO filtrar secretos.

5) Repo hygiene:
   - Elimina/evita duplicados tipo page.tsx fuera de /app si existen y no se usan.
   - Asegura que `npm run build` pasa en GitHub Actions y en Vercel.

Entrega:
- PR con cambios + checklist en el PR description de las pruebas anteriores.
## TASK 001 — End-to-end leads + duplicados (frontend+backend) sin romper build
STATUS: TODO
BRANCH: agent/task-001-leads-e2e

SCOPE:
- Permitido: app/page.tsx, app/api/leads/route.ts, lib/**, types/**, utils/**
- Prohibido: runtime edge, upgrades masivos, cambios de DB sin migration

GOAL:
- Landing funciona end-to-end: inserta lead en Supabase, maneja duplicados por email/teléfono y valida teléfono opcional.

ACCEPTANCE:
- [ ] Envío OK → inserta en Supabase (name, email, city, role, phone)
- [ ] Email duplicado → HTTP 409 y mensaje EXACTO: "Email ya registrado"
- [ ] Teléfono duplicado (si se envía) → HTTP 409 y mensaje EXACTO: "Teléfono ya registrado"
- [ ] Email inválido → error claro en UI y NO envía
- [ ] Teléfono opcional: si se rellena, exige repetir y que coincida (si no, NO envía)
- [ ] Normalización de phone en frontend y backend: aceptar + espacios guiones, comparar/guardar como solo dígitos
- [ ] `npm run build` pasa en GitHub Actions y Vercel

NOTES:
- UI: success y error mutuamente excluyentes (nunca ambos)
- Tras success: limpiar campos (email/nombre/teléfonos), opcional mantener city/role
- Backend: console.error sin filtrar secretos; devolver 409 solo para duplicados
