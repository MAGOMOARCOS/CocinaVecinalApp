# Cocina Vecinal — Project Brief (master)

## Regla nº1
Primero **build verde en Vercel**. Luego funcionalidades.

## Stack
Next.js (App Router) + Supabase + Vercel.

## Modo de trabajo
Un paso por mensaje. Sin experimentos. Cambios pequeños y verificables.

## Objetivo MVP
- Pagos reales
- Chat post-pago
- Lógica entrega/recogida (radio y opciones)

## Estado actual (2026-01-16)
Repo reiniciado: solo quedan .github/, README.md, .gitignore y RESET_NOW.txt.
Siguiente paso: crear app Next.js limpia y desplegarla con build OK.

## Problema histórico a evitar
Error en build/prerender: `supabaseUrl is required` por env vars.
Solución: no tocar Supabase hasta tener build verde; cuando se integre, proteger código server/client y validar env vars.
