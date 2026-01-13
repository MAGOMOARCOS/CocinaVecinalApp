# CocinaVecinalApp — tarea del agente

Objetivo: arreglar el build y ejecutar lo que pida AGENT_TASKS.md sin romper despliegue.

Reglas:
- Trabaja SOLO dentro del repo.
- No introduzcas secretos ni valores reales: usa variables de entorno y documenta en `.env.example`.
- Arregla imports rotos (p.ej. `@/lib/supabaseClient`), alias y exports.
- Mantén cambios mínimos y con TypeScript correcto.
- Tras cambiar, ejecuta `npm run build` y deja el repo compilando.

## AGENT_TASKS.md
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


## Log preflight (tail)
```

> nextjs@0.1.0 build
> next build --webpack

⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

▲ Next.js 16.1.1 (webpack)

  Creating an optimized production build ...
✓ Compiled successfully in 4.3s
  Running TypeScript ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/4) ...
  Generating static pages using 3 workers (1/4) 
  Generating static pages using 3 workers (2/4) 
  Generating static pages using 3 workers (3/4) 
✓ Generating static pages using 3 workers (4/4) in 169.0ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content


```



## Instrucción extra
/agent full
Objetivo: arreglar el submit del formulario (ahora hace POST a /api/leads y devuelve 405).

1) Implementar endpoint Next.js App Router:
   - Crear app/api/leads/route.ts (si el proyecto usa src/app, entonces src/app/api/leads/route.ts).
   - Añadir handler POST que acepte JSON del frontend: { name, email, city, role, wa, honeypot }.
     * Soportar también alias: interest = role, whatsapp = wa.
   - Validar:
     * name y email obligatorios
     * email con formato válido
     * si honeypot viene con algo -> responder 400
   - Persistencia:
     * Insertar en Supabase en tabla "leads" (campos sugeridos: created_at, name, email, city, interest/role, whatsapp).
     * Si faltan env vars de Supabase o falla el insert, hacer fallback: log en consola y devolver 200 con { ok:true, stored:false, message:"capturado pero no guardado: falta config" } para no romper la captación.

2) Respuesta API:
   - En success real: 200 { ok:true, stored:true, message:"Gracias, estás en la lista" }
   - En validación: 400 { ok:false, message:"..." }
   - En error inesperado: 500 { ok:false, message:"..." }

3) UI:
   - En el submit, si ok:true mostrar mensaje de éxito y limpiar inputs.
   - Si ok:false mostrar error legible.

4) Asegurar que npm run build pasa y abrir PR.

