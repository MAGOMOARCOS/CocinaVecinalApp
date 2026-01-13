- Added POST handler for waitlist leads with validation, honeypot guard, Supabase insert when server env vars are present, and console fallback when not (`app/api/leads/route.ts`).
- Updated the waitlist form to send `interest`/`whatsapp`, surface a default success message, and reset after submission in both entry points (`app/page.tsx`, `page.tsx`).
- Ran `npm install` (lockfile already in sync) and built successfully; committed as `chore: sync package-lock and fix build`.

Tests: `npm run build` (pass).

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (plus the public keys) in Vercel to persist leads in production.