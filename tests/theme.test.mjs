import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile('public/theme-init.js', 'utf8');
function boot({ saved = null, dark = false, blocked = false } = {}) {
  const docEvents = {}, winEvents = {}; let mediaChange;
  const meta = {}; const media = { matches: dark, addEventListener: (_, fn) => { mediaChange = fn; } };
  let stored = saved;
  const document = { documentElement: { dataset: {} }, querySelector: () => meta,
    addEventListener: (name, fn) => { docEvents[name] = fn; }, dispatchEvent: event => docEvents[event.type]?.(event) };
  const window = { matchMedia: () => media, addEventListener: (name, fn) => { winEvents[name] = fn; },
    localStorage: { getItem: () => { if (blocked) throw Error('blocked'); return stored; }, setItem: (_, value) => { if (blocked) throw Error('blocked'); stored = value; } } };
  vm.runInNewContext(source, { window, document, Event: class { constructor(type) { this.type = type; } } });
  return { theme: () => document.documentElement.dataset.theme, stored: () => stored, meta,
    toggle: () => docEvents['outrn:toggle-theme'](), system: value => { media.matches = value; mediaChange(); },
    storage: value => winEvents.storage({ key: 'outrn-theme', newValue: value }) };
}
test('system preference applies before render and follows changes until overridden', () => {
  const app = boot({ dark: true }); assert.equal(app.theme(), 'dark'); assert.equal(app.meta.content, '#20251f');
  app.system(false); assert.equal(app.theme(), 'light');
  app.toggle(); assert.equal(app.theme(), 'dark'); assert.equal(app.stored(), 'dark');
  app.system(false); assert.equal(app.theme(), 'dark');
});
test('saved preference survives reload and synchronizes across tabs', () => {
  const app = boot({ saved: 'light', dark: true }); assert.equal(app.theme(), 'light');
  app.storage('dark'); assert.equal(app.theme(), 'dark');
  app.storage(null); app.system(false); assert.equal(app.theme(), 'light');
});
test('invalid or unavailable storage does not break switching', () => {
  assert.equal(boot({ saved: 'invalid', dark: true }).theme(), 'dark');
  const app = boot({ blocked: true }); app.toggle(); assert.equal(app.theme(), 'dark');
  app.system(false); assert.equal(app.theme(), 'dark'); app.toggle(); assert.equal(app.theme(), 'light');
});
