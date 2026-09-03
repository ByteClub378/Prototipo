import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function collectJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectJavaScript(path));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  ...await collectJavaScript(resolve(backendRoot, "src")),
  ...await collectJavaScript(resolve(backendRoot, "scripts")),
].filter((path) => !path.endsWith("check-syntax.js"));

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Sintaxe validada em ${files.length} arquivos JavaScript.`);
