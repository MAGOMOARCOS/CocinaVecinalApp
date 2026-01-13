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
✓ Compiled successfully in 5.3s
  Running TypeScript ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/5) ...
  Generating static pages using 3 workers (1/5) 
  Generating static pages using 3 workers (2/5) 
  Generating static pages using 3 workers (3/5) 
✓ Generating static pages using 3 workers (5/5) in 204.7ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api/leads


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


```



## Instrucción extra
/agent full
Ahora ya existen en Vercel (Production) estas env vars:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Problema actual en producción: al enviar el formulario puede mostrar “Gracias, estás en la lista” pero también “Error al enviar el formulario”.
Tarea:
1) Reproducir en producción y revisar Network/Response de POST /api/leads.
2) Corregir el frontend para que:
   - NO muestre error cuando la respuesta sea ok (según JSON { ok: true }).
   - Use data.ok (no solo response.ok) y maneje correctamente errores 4xx/5xx.
   - Limpie el estado de error en éxito y no dispare doble submit.
3) Revisar /app/api/leads/route.ts para que siempre responda JSON consistente:
   { ok: boolean, message?: string, error?: string, stored?: boolean }
   y use códigos HTTP adecuados (200 éxito, 400 validación, 500 servidor).
4) Abrir PR con el fix y dejar nota en README de env vars requeridas.

