import fs from "fs";
import { execSync } from "child_process";

const kickoffPath = ".codex-kickoff";

console.log("🤖 Codex Agent iniciado...");

if (!fs.existsSync(kickoffPath)) {
  console.log("❌ No existe .codex-kickoff. Nada que hacer.");
  process.exit(0);
}

const instructions = fs.readFileSync(kickoffPath, "utf8");
console.log("📜 Instrucciones detectadas:\n", instructions);

// Ejemplo de detección simple
if (instructions.includes("supabaseClient")) {
  console.log("🪄 Creando archivo lib/supabaseClient.ts");
  fs.mkdirSync("lib", { recursive: true });
  fs.writeFileSync(
    "lib/supabaseClient.ts",
    `import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);`
  );
}

if (instructions.includes("tsconfig") || instructions.includes("alias")) {
  console.log("🪄 Asegurando baseUrl en tsconfig.json");
  const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
  tsconfig.compilerOptions.baseUrl = ".";
  tsconfig.compilerOptions.paths = { "@/*": ["./*"] };
  fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2));
}

// Commit & push
try {
  execSync("git config user.name 'Codex Agent'");
  execSync("git config user.email 'bot@cocinavecinal.com'");
  execSync("git add .");
  execSync("git commit -m '🤖 fix: applied Codex Agent instructions' || echo 'No changes'");
  execSync("git push");
  console.log("✅ Cambios enviados a GitHub");
} catch (err) {
  console.error("⚠️ Error al hacer push:", err.message);
}

console.log("🏁 Agente finalizado");
