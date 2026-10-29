import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const workerSource = await readFile(new URL('sw.js', root), 'utf8');

function workerHarness(scope = 'https://example.test/mahjong/') {
  const listeners = new Map();
  const stores = new Map();
  let claimed = false;
  let activated = false;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async key => stores.delete(key),
    async open(key) {
      if (!stores.has(key)) stores.set(key, new Map());
      const store = stores.get(key);
      return {
        async addAll(paths) {
          const entries = await Promise.all(paths.map(async path => {
            const file = path === './' ? 'index.html' : path.slice(2);
            return [new URL(path, scope).href, await readFile(new URL(file, root), 'utf8')];
          }));
          for (const [url, body] of entries) store.set(url, body);
        },
        match: async url => store.get(url),
      };
    },
  };
  const context = vm.createContext({
    URL,
    caches,
    fetch: async () => { throw new Error('offline'); },
    self: {
      registration: { scope },
      addEventListener: (type, handler) => listeners.set(type, handler),
      clients: { claim: async () => { claimed = true; } },
      skipWaiting: async () => { activated = true; },
    },
  });
  vm.runInContext(workerSource, context);
  return {
    stores,
    get claimed() { return claimed; },
    get activated() { return activated; },
    async dispatch(type, data = {}) {
      let pending;
      let response;
      listeners.get(type)({ ...data, waitUntil: promise => { pending = promise; }, respondWith: promise => { response = promise; } });
      await pending;
      return response;
    },
  };
}

test('manifest zawiera ikony Android i uruchamia aplikację samodzielnie także w podkatalogu', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  for (const value of [manifest.id, manifest.start_url, manifest.scope]) {
    assert.equal(new URL(value, 'https://example.test/mahjong/manifest.webmanifest').pathname, '/mahjong/');
  }
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}` && icon.purpose === 'any');
    assert.ok(icon);
    const png = await readFile(new URL(icon.src, root));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  const apple = await readFile(new URL('icons/apple-touch-icon.png', root));
  assert.equal(apple.readUInt32BE(16), 180);
  assert.equal(apple.readUInt32BE(20), 180);
});

test('gra, style i cały graf modułów są dostępne bez sieci również w podkatalogu', async () => {
  const worker = workerHarness();
  await worker.dispatch('install');
  await worker.dispatch('activate');
  assert.equal(worker.claimed, true);
  const home = await worker.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: 'https://example.test/mahjong/?source=home' } });
  assert.match(home, /id="board"/);
  async function verifyModule(path) {
    const url = new URL(path, 'https://example.test/mahjong/');
    const source = await worker.dispatch('fetch', { request: { method: 'GET', mode: 'cors', url: url.href } });
    assert.equal(typeof source, 'string', `${path} musi być w cache`);
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      await verifyModule(new URL(match[1], url).href);
    }
  }
  await verifyModule('./src/main.js');
  const styles = await worker.dispatch('fetch', { request: { method: 'GET', url: 'https://example.test/mahjong/styles.css' } });
  assert.match(styles, /\.tile-field/);
});

test('aktywacja usuwa stary cache Mahjong i zachowuje cache innych aplikacji', async () => {
  const worker = workerHarness();
  worker.stores.set('mahjong:/mahjong/:mahjong-shell-old', new Map());
  worker.stores.set('mahjong:/another-game/:mahjong-shell-old', new Map());
  worker.stores.set('other-app', new Map());
  await worker.dispatch('install');
  await worker.dispatch('activate');
  assert.equal(worker.stores.has('mahjong:/mahjong/:mahjong-shell-old'), false);
  assert.equal(worker.stores.has('mahjong:/another-game/:mahjong-shell-old'), true);
  assert.equal(worker.stores.has('other-app'), true);
});

test('aktualizacja czeka na świadome odświeżenie i nie przechwytuje obcych żądań', async () => {
  const worker = workerHarness();
  await worker.dispatch('install');
  assert.equal(worker.activated, false);
  for (const request of [
    { method: 'POST', url: 'https://example.test/mahjong/' },
    { method: 'GET', url: 'https://outside.test/styles.css' },
    { method: 'GET', url: 'https://example.test/account' },
  ]) assert.equal(await worker.dispatch('fetch', { request }), undefined);
  await worker.dispatch('message', { data: { type: 'ACTIVATE_UPDATE' } });
  assert.equal(worker.activated, true);
});

test('serwer udostępnia manifest i ikony z poprawnym MIME, bez kodu narzędziowego', async t => {
  const server = spawn(process.execPath, ['server.mjs'], { cwd: fileURLToPath(root), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => server.kill());
  const [output] = await once(server.stdout, 'data');
  const port = output.toString().match(/:(\d+)/)?.[1];
  assert.ok(port);
  const base = `http://127.0.0.1:${port}`;
  for (const [path, type] of [['manifest.webmanifest', 'application/manifest+json'], ['sw.js', 'text/javascript'], ['icons/icon-192.png', 'image/png']]) {
    const response = await fetch(`${base}/${path}`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal(response.headers.get('cache-control'), 'no-store');
    await response.arrayBuffer();
  }
  for (const path of ['package.json', 'README.md', 'scripts/build.mjs', 'tests/pwa.test.js']) {
    assert.equal((await fetch(`${base}/${path}`)).status, 404);
  }
});
