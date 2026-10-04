import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const publish = resolve(".pages-build");
const html = await readFile(resolve(publish, "index.html"), "utf8");
const origin = "https://outrn.example";

async function checkAsset(value, from = `${origin}/`) {
  if (/^(data:|https?:\/\/)/.test(value)) return;
  const url = new URL(value, from);
  assert.ok(!url.pathname.startsWith("/OutRN/"), `GitHub-only path: ${url.pathname}`);
  const file = resolve(publish, `.${decodeURIComponent(url.pathname)}`);
  assert.ok((await stat(file)).isFile(), `Missing deploy asset: ${url.pathname}`);
}

test("Netlify output includes the prerendered page, waitlist and root-safe assets", async () => {
  assert.match(html, /aria-label="Got free time\? Try going out Right Now\."/);
  assert.match(html, /action="https:\/\/formspree.io\/f\/myeybdge"/);
  assert.match(html, /<input(?=[^>]*name="email")(?=[^>]*required="")[^>]*>/);
  assert.doesNotMatch(html, /<!--app-html-->|\/OutRN\/|chatgpt\.site|\/api\/waitlist/);
  const refs = [...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)];
  assert.ok(refs.length > 8, "Expected scripts, styles, images and fonts");
  for (const [, asset] of refs) await checkAsset(asset);
  await checkAsset("/public/theme-init.js");
  const expectedUrl = process.env.SITE_URL || process.env.URL;
  if (expectedUrl) assert.ok(html.includes(`href="${new URL("/", expectedUrl).href}"`));
  else assert.doesNotMatch(html, /rel="canonical"/);
});

test("CSS font URLs and every copied hero image resolve inside the publish folder", async () => {
  const assets = await readdir(resolve(publish, "site-assets"));
  const styles = assets.filter(name => name.endsWith(".css"));
  assert.ok(styles.length > 0);
  let fontCount = 0;
  for (const name of styles) {
    const css = await readFile(resolve(publish, "site-assets", name), "utf8");
    assert.doesNotMatch(css, /\/OutRN\//);
    for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      await checkAsset(url, `${origin}/site-assets/${name}`);
      if (url.endsWith(".woff2")) fontCount++;
    }
  }
  assert.equal(fontCount, 3);
  for (const name of ["jazz-film", "gallery-film", "dinner-film", "waterfront-film", "city-afternoon"]) {
    await checkAsset(`/public/images/${name}.webp`);
  }
  const scripts = assets.filter(name => name.endsWith(".js"));
  for (const name of scripts) {
    assert.doesNotMatch(await readFile(resolve(publish, "site-assets", name), "utf8"), /\/OutRN\//);
  }
});
