- Reworked layout/fonts to avoid external fetches and use local fallbacks (`app/layout.tsx`, `layout.tsx`), with globals consolidated through `styles/globals.css` and simple imports in `app/globals.css`/`globals.css`; PostCSS config now empty since we import Tailwind’s prebuilt CSS slices.
- Added base URL for path aliases in `tsconfig.json`, ensuring `@/lib/supabaseClient` resolves cleanly across routes.
- Added stub UI pieces `components/Header.tsx`, `components/Footer.tsx`, and `components/Loader.tsx`; kept Tailwind defaults available via static CSS imports.
- Updated scripts/deps so `npm run build` uses webpack (Turbopack hit a sandbox port-binding error here); `npm install` (offline) refreshed `package-lock.json`.
- Build now passes locally with `npm run build`.

Commit: `chore: sync package-lock and fix build`.

Next steps: 1) Set `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel before deploying. 2) If you prefer Turbopack on Vercel, drop `--webpack` from the build script there once the environment allows it.