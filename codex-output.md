**Changes**
- Added `app/api/leads/route.ts` POST handler with field aliases, validation (name/email, email format, honeypot), Supabase insert via service key, and safe fallback `{ ok:true, stored:false, message:"capturado pero no guardado: falta config" }` when config/insert fails.
- Updated the waitlist form in `app/page.tsx` and `page.tsx` to surface API messages, show readable errors, and reset inputs on successful submissions.
- Ran `npm install` (lock already in sync) and committed as requested (`chore: sync package-lock and fix build`). Pre-existing changes in `.github/codex/prompt.md` and `preflight.log` were left untouched.

**Tests**
- `npm install`
- `npm run build`

Set Supabase env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) on Vercel and ensure the `leads` table exists so the new endpoint stores records.