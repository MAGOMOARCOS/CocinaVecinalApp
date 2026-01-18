# Phase 1 — Base App (NO romper build)

## Objetivo
Dejar una base mínima limpia y estable para continuar fases posteriores sin fricción.

## Reglas (obligatorias)
- NO romper el build (CI debe quedar en verde).
- NO tocar Supabase schemas / migrations / SQL.
- NO activar Auth todavía (solo preparar estructura).
- Mantener cambios pequeños y revisables.
- Si falta una variable de entorno, NO fallback a strings hardcodeados: documentar y usar env vars.

## Tareas
1) Home sin warnings
- Asegurar que la Home renderiza sin errores ni warnings en consola (dev/build).
- Evitar imports no usados, keys de React, etc.

2) Layout base
- Implementar layout común con:
  - Header: logo/texto “Cocina Vecinal” + links (Home / Explorar / Perfil)
  - Footer: texto simple (copyright / enlaces básicos)
- Debe aplicarse a todas las rutas existentes.

3) Preparar estructura para Auth (sin activarla)
- Crear estructura de carpetas/componentes para auth (por ejemplo `app/(auth)/...` o `components/auth/...`)
- Crear un “placeholder” de sesión (por ejemplo `getSession()` que devuelva null) sin conectar aún.
- No debe requerir claves nuevas ni romper despliegues.

## Criterios de aceptación
- `npm run build` OK en CI.
- Vercel Production OK.
- Navegación funciona (Home/Explorar/Perfil).
- No hay warnings relevantes en consola.
