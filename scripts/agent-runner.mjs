import fs from "node:fs";
import { spawnSync } from "node:child_process";

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
  return { code: r.status ?? 0, out: r.stdout ?? "", err: r.stderr ?? "" };
}

function readEventInstruction() {
  const p = process.env.GITHUB_EVENT_PATH;
  if (!p || !fs.existsSync(p)) return "";
  const ev = JSON.parse(fs.readFileSync(p, "utf8"));
  const body = ev?.comment?.body || "";
  if (body.startsWith("/agent")) return body.replace(/^\/agent\s*/i, "").trim();
  return "";
}

function readAgentTasksFallback() {
  const file = "AGENT_TASKS.md";
  if (!fs.existsSync(file)) return "";
  const text = fs.readFileSync(file, "utf8");

  // Coge la primera tarea tipo:
  // - [ ] ...
  const m = text.match(/^\s*-\s*\[\s*\]\s*(.+)$/m);
  return m ? m[1].trim() : "";
}

async function openaiPatch({ instruction, buildLog }) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // cámbialo si quieres

  const prompt = `
Eres un agente de ingeniería dentro de un repo Next.js.
Objetivo: generar un ÚNICO parche (unified diff) que arregle el problema.

ORDEN DEL USUARIO:
${instruction}

LOG DE BUILD (npm run build):
${buildLog}

REGLAS:
- Devuelve SOLO un unified diff entre triple backticks.
- No incluyas explicación fuera del diff.
- Cambios mínimos para que el build pase.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Responde estrictamente con un parche diff." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${t}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  const diff = extractDiff(content);
  if (!diff) throw new Error("No se encontró un diff válido en la respuesta del modelo.");
  return diff;
}

function extractDiff(text) {
  // Busca un bloque ```diff ... ```
  const m = text.match(/```diff\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  const candidate = m ? m[1] : "";
  const looksLikeDiff =
    candidate.includes("diff --git") || candidate.includes("@@") || candidate.startsWith("---");
  return looksLikeDiff ? candidate.trim() + "\n" : "";
}

function runBuild() {
  const r = sh("npm", ["run", "build"]);
  return { ok: r.code === 0, log: (r.out + "\n" + r.err).trim() };
}

function applyDiff(diff) {
  fs.writeFileSync(".agent.patch", diff, "utf8");
  const r = sh("git", ["apply", "--whitespace=fix", ".agent.patch"]);
  return { ok: r.code === 0, log: (r.out + "\n" + r.err).trim() };
}

function hasChanges() {
  const r = sh("git", ["status", "--porcelain"]);
  return r.out.trim().length > 0;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Falta OPENAI_API_KEY en secrets.");
    process.exit(1);
  }

  const direct = (process.env.AGENT_INSTRUCTION || "").trim();
  const fromComment = readEventInstruction();
  const fromTasks = readAgentTasksFallback();

  const instruction = direct || fromComment || fromTasks;
  if (!instruction) {
    console.error("No hay orden. Pasa 'instruction' en workflow_dispatch, usa /agent en un comentario o añade una tarea en AGENT_TASKS.md.");
    process.exit(1);
  }

  const maxIters = parseInt(process.env.AGENT_MAX_ITERS || "2", 10);

  console.log("=== AGENT ORDER ===");
  console.log(instruction);

  // Intento 0: build tal cual
  let { ok, log } = runBuild();
  console.log("=== BUILD LOG (attempt 0) ===");
  console.log(log);

  if (ok) {
    console.log("Build OK. Si hay cambios pendientes, se abrirá PR; si no, no hará nada.");
    process.exit(0);
  }

  for (let i = 1; i <= maxIters; i++) {
    console.log(`=== FIX ITERATION ${i}/${maxIters} ===`);

    const diff = await openaiPatch({ instruction, buildLog: log });
    console.log("=== GENERATED DIFF ===");
    console.log(diff);

    const applied = applyDiff(diff);
    if (!applied.ok) {
      console.log("git apply falló:");
      console.log(applied.log);
      // Si no aplicó, seguimos pero con mismo log (o podrías cortar)
    }

    const built = runBuild();
    console.log(`=== BUILD LOG (attempt ${i}) ===`);
    console.log(built.log);

    if (built.ok) {
      console.log("Build fixed ✅");
      break;
    }

    log = built.log;
  }

  if (!hasChanges()) {
    console.log("No hay cambios en git; no se creará PR.");
    process.exit(1);
  }

  // Si llegamos aquí, hay cambios. El action create-pull-request los recogerá.
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
