import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const entries = ['index.html', 'styles.css', 'favicon.svg', 'manifest.webmanifest', 'sw.js', 'src', 'icons'];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(join(directory, entry.name)) : join(directory, entry.name)));
  return files.flat().sort();
}

const hash = createHash('sha256');
for (const entry of entries) {
  const path = join(root, entry);
  const files = ['src', 'icons'].includes(entry) ? await filesIn(path) : [path];
  for (const file of files) {
    hash.update(file.slice(root.length).replaceAll('\\', '/'));
    hash.update(await readFile(file));
  }
}
const version = hash.digest('hex').slice(0, 16);
await mkdir(output, { recursive: true });
for (const entry of entries) await cp(join(root, entry), join(output, entry), { recursive: true });
const workerPath = join(output, 'sw.js');
const worker = await readFile(workerPath, 'utf8');
await writeFile(workerPath, worker.replace("'mahjong-shell-v1'", `'mahjong-shell-${version}'`));
console.log(`Gotowa aplikacja PWA: ${output} (wersja ${version})`);
