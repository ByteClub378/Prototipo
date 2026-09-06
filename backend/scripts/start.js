import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function run(script) {
  const result = spawnSync(process.execPath, [resolve(script)], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[setup] Criando/verificando banco e aplicando migrations...");
run("backend/src/database/migrate.js");

console.log("[setup] Carregando catálogo inicial...");
run("backend/src/database/seed.js");

console.log("[setup] Configuração concluída. Iniciando API...");
await import("../src/server.js");
