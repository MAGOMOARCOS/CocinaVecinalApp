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
✓ Compiled successfully in 4.4s
  Running TypeScript ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/4) ...
  Generating static pages using 3 workers (1/4) 
  Generating static pages using 3 workers (2/4) 
  Generating static pages using 3 workers (3/4) 
✓ Generating static pages using 3 workers (4/4) in 228.1ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content


```



## Instrucción extra
/agent full
Fix lead form submit: the frontend posts to /api/leads but it returns 405. Implement POST handler for /api/leads (Next.js route) to accept JSON {name,email,city,interest,whatsapp?}, validate, store in Supabase (or fallback to in-memory/console if env missing), return 200 JSON on success and 4xx/5xx with message. Update UI to show success message. Ensure npm run build passes and open PR.

