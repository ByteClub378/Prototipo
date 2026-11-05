// Gera WebP e atualiza imports. Mantém os originais para revisão/rollback.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}
async function main() {
  const sourceFiles = await walk(path.join(root, 'src'));
  const originals = sourceFiles.filter(file => /\.(png|jpe?g)$/i.test(file) && !file.includes('logo-cruzeiro'));
  const replacements = [];
  let before = 0, after = 0;
  for (const original of originals) {
    const output = original.replace(/\.(png|jpe?g)$/i, '.webp');
    const isDifferenceGame = original.includes(`${path.sep}sul${path.sep}`);
    let pipeline = sharp(original);
    // Sete erros: preserva pixels e dimensões para não alterar as diferenças.
    if (!isDifferenceGame) pipeline = pipeline.resize({ width: original.includes('paisagem') ? 1920 : 1280, withoutEnlargement: true });
    await pipeline.webp(isDifferenceGame ? { lossless: true, effort: 5 } : { quality: 86, effort: 5 }).toFile(output);
    before += (await fs.stat(original)).size; after += (await fs.stat(output)).size;
    replacements.push([path.basename(original), path.basename(output)]);
  }
  for (const file of sourceFiles.filter(file => /\.(tsx?|css|json)$/.test(file))) {
    let text = await fs.readFile(file, 'utf8');
    for (const [from, to] of replacements) text = text.split(from).join(to);
    await fs.writeFile(file, text);
  }
  console.log(JSON.stringify({ files: originals.length, originalBytes: before, webpBytes: after, reductionPercent: Math.round((1 - after / before) * 100) }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
