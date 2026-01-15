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
