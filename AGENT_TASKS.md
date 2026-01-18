diff --git a/.github/next.config.js b/.github/next.config.js
deleted file mode 100644
index 1111111..0000000
--- a/.github/next.config.js
+++ /dev/null
@@ -1,25 +0,0 @@
-// (archivo mal ubicado y con sintaxis TS en .js)
-
diff --git a/.github/tsconfig.json b/.github/tsconfig.json
deleted file mode 100644
index 2222222..0000000
--- a/.github/tsconfig.json
+++ /dev/null
@@ -1,200 +0,0 @@
-// (archivo mal ubicado)
-
diff --git a/next.config.mjs b/next.config.mjs
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/next.config.mjs
@@ -0,0 +1,18 @@
+/** @type {import('next').NextConfig} */
+const nextConfig = {
+  reactStrictMode: true,
+  // Deja la configuración mínima y estable.
+  // Cuando metamos Supabase, lo haremos por ENV vars y server components, sin prerender raro.
+};
+
+export default nextConfig;
+
diff --git a/tsconfig.json b/tsconfig.json
new file mode 100644
index 0000000..4444444
--- /dev/null
+++ b/tsconfig.json
@@ -0,0 +1,39 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "lib": ["dom", "dom.iterable", "esnext"],
+    "allowJs": true,
+    "skipLibCheck": true,
+    "strict": true,
+    "noEmit": true,
+    "esModuleInterop": true,
+    "module": "esnext",
+    "moduleResolution": "bundler",
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "jsx": "preserve",
+    "incremental": true,
+    "plugins": [{ "name": "next" }],
+    "baseUrl": ".",
+    "paths": {
+      "@/*": ["./*"]
+    }
+  },
+  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
+  "exclude": ["node_modules"]
+}
+
diff --git a/next-env.d.ts b/next-env.d.ts
new file mode 100644
index 0000000..5555555
--- /dev/null
+++ b/next-env.d.ts
@@ -0,0 +1,5 @@
+/// <reference types="next" />
+/// <reference types="next/image-types/global" />
+/// <reference types="next/navigation-types/compat/navigation" />
+// NOTE: This file should not be edited
+
