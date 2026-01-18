\# AGENT TASKS — CocinaVecinalApp



\## MODO DE TRABAJO (OBLIGATORIO)

\- Trabajar SIEMPRE en una rama nueva (nunca en main).

\- Abrir Pull Request para cada cambio.

\- No hacer merge automático.

\- Cada PR debe pasar CI (npm run build) en verde.



\## PROHIBICIONES ABSOLUTAS

\- NO tocar secrets, env vars ni configuraciones de Vercel.

\- NO modificar workflows CI.

\- NO instalar dependencias nuevas sin justificarlo en el PR.

\- NO usar npm audit fix --force.

\- NO eliminar código existente sin explicar el motivo.



\## OBJETIVO ACTUAL

Fase 1 — Base funcional sin backend:

1\. Home clara (qué es Cocina Vecinal).

2\. Estructura de páginas:

&nbsp;  - /

&nbsp;  - /explorar

&nbsp;  - /perfil

3\. Navegación simple entre páginas.

4\. Todo debe compilar en build.



\## REGLA DE ORO

Si algo no está claro:

\- Detenerse.

\- Explicarlo en el PR.

\- NO improvisar.

# Phase 1 – Base App

- Asegurar que la home carga sin warnings
- Añadir layout base (header + footer)
- Preparar estructura para auth (sin activarla aún)
- No romper build
- No tocar Supabase schemas todavía


