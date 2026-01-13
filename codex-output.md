- Updated `app/page.tsx` lead form submission so success/error states are mutually exclusive: clear error up front, clear it again on success, set the fixed success message, and nullify success on error.
- Ran `npm install` (lock already in sync) and committed fix as `chore: sync package-lock and fix build`.

**Tests**
- `npm run build`

**Notes**
- Remaining local changes not part of the commit: `.github/codex/prompt.md`, `preflight.log`.