# AGENT TASKS (PR-driven) — SAFE (no API)

Pega **UN** patch en formato unified diff entre los marcadores.
El workflow lo aplicará en una rama y abrirá PR automáticamente.

<!-- AGENT_PATCH_BEGIN -->
diff --git a/.github/next.config.js b/.github/next.config.js
--- a/.github/next.config.js
+++ /dev/null
@@ -1,6 +0,0 @@
-/** @type {import('next').NextConfig} */
-const nextConfig = {
-  /* config options here */
-};
-
-module.exports = nextConfig;

diff --git a/.github/next-env.d.ts b/.github/next-env.d.ts
--- a/.github/next-env.d.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-/// <reference types="next" />
-/// <reference types="next/image-types/global" />
-//
-// NOTE: This file should not be edited
-// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.

diff --git a/.github/tsconfig.json b/.github/tsconfig.json
--- a/.github/tsconfig.json
+++ /dev/null
@@ -1,26 +0,0 @@
-{
-  "compilerOptions": {
-    "target": "es5",
-    "lib": ["dom", "dom.iterable", "esnext"],
-    "allowJs": true,
-    "skipLibCheck": true,
-    "strict": true,
-    "forceConsistentCasingInFileNames": true,
-    "noEmit": true,
-    "esModuleInterop": true,
-    "module": "esnext",
-    "moduleResolution": "bundler",
-    "resolveJsonModule": true,
-    "isolatedModules": true,
-    "jsx": "preserve",
-    "incremental": true,
-    "plugins": [{ "name": "next" }],
-    "paths": { "@/*": ["./*"] }
-  },
-  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
-  "exclude": ["node_modules"]
-}

diff --git a/next.config.ts b/next.config.ts
--- /dev/null
+++ b/next.config.ts
@@ -0,0 +1,6 @@
+import type { NextConfig } from "next";
+
+const nextConfig: NextConfig = {};
+
+export default nextConfig;
<!-- AGENT_PATCH_END -->
