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
> next build

⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

▲ Next.js 16.1.1 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 3.0s
  Running TypeScript ...

  We detected TypeScript in your project and reconfigured your tsconfig.json file for you.
  The following suggested values were added to your tsconfig.json. These values can be changed to fit your project's needs:

  	- include was updated to add '.next/dev/types/**/*.ts'

  The following mandatory changes were made to your tsconfig.json:

  	- jsx was set to react-jsx (next.js uses the React automatic runtime)

  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/4) ...
  Generating static pages using 3 workers (1/4) 
  Generating static pages using 3 workers (2/4) 
  Generating static pages using 3 workers (3/4) 
✓ Generating static pages using 3 workers (4/4) in 122.0ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content


```

