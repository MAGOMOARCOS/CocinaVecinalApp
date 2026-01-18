## TASK
Fix build to be green in Vercel.

## CONSTRAINTS
- Do not add Supabase
- Do not add env vars
- Do not touch CI workflow

## PATCH
```patch
diff --git a/app/page.tsx b/app/page.tsx
index 123..456 100644
--- a/app/page.tsx
+++ b/app/page.tsx
@@ -1,5 +1,5 @@
 export default function Home() {
-  throw new Error("todo");
+  return <main>OK</main>;
 }
