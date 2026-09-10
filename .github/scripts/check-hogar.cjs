const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const project = JSON.parse(fs.readFileSync(path.join(root, '.firebaserc'), 'utf8'));
assert.equal(project.projects.default, 'home-escuelard');
assert.equal(config.hosting.public, 'docs');
const publicDir = path.join(root, 'docs');
function asset(relative) {
  const target = path.resolve(publicDir, relative);
  assert.ok(target.startsWith(publicDir + path.sep), `Asset outside docs: ${relative}`);
  assert.ok(fs.statSync(target).isFile(), `Missing asset: ${relative}`);
  return fs.readFileSync(target, 'utf8');
}

const html = asset('index.html');
assert.match(html, /<title>Hogar escuelaRD<\/title>/);
assert.match(html, /id="hogar"/);
assert.doesNotMatch(html, /id="app"/);
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) asset(match[1]);

const manifest = JSON.parse(asset('manifest.webmanifest'));
assert.equal(manifest.name, 'Hogar escuelaRD');
assert.equal(manifest.start_url, './#/');
assert.equal(manifest.scope, './');
assert.equal(manifest.id, './');
for (const icon of manifest.icons) asset(icon.src);

const worker = asset('sw.js');
assert.match(worker, /hogar-public-[a-f0-9]{16}/);
const precache = worker.match(/const PUBLIC_ASSETS = (\[[^;]+\]);/);
assert.ok(precache, 'Service worker must include the current build assets');
const files = JSON.parse(precache[1]);
assert.ok(files.some(file => file.endsWith('.js')));
for (const file of files) asset(file);
assert.ok(config.hosting.headers.some(rule => rule.source === '/sw.js'
  && rule.headers.some(header => header.key === 'Cache-Control' && header.value.includes('no-store'))));
console.log(`Hogar ready for home-escuelard: manifest, worker, icons and ${files.length} compiled assets verified.`);
