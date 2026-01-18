# AGENT_TASKS — CocinaVecinalApp

## REGLAS DURAS (NO NEGOCIABLES)
- NO romper el build: npm run build debe quedar OK al final.
- Cambios mínimos y reversibles.
- NO tocar Supabase schemas / migrations / SQL.
- NO añadir dependencias nuevas salvo que sea imprescindible.
- NO tocar workflows de GitHub Actions (.github/workflows).
- NO añadir secretos ni claves en código. Usar solo env vars ya existentes.
- Mantener Next.js App Router.

## PHASE 1 — Base App (MVP base estable)

### TASK 1 — Layout base sin warnings
Objetivo:
- Asegurar que la home carga sin warnings relevantes.
- Añadir un layout base global con Header + Footer.
- Mantener el contenido existente de la home (no borrar texto ni links actuales).

Requisitos técnicos:
- Implementar Header y Footer como componentes simples en `app/` (o `components/` si ya existe).
- Aplicar el layout desde `app/layout.tsx` (App Router).
- Estilos mínimos (sin librerías nuevas). Si no hay CSS, usa clases simples o inline.

Criterio de aceptación:
- `npm run build` OK.
- La home se ve con Header arriba y Footer abajo.
- Sin warnings de React por `useEffect`, keys, o HTML inválido.

Entrega:
- Hacer commit con mensaje: `feat: base layout header footer`
- Abrir PR contra `main` con resumen de cambios.
<!-- trigger -->
