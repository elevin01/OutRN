import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
test("Pages serves a prerendered landing page with subpath-safe assets", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /aria-label="Got free time\? Try going out Right Now\."/);
  assert.match(html, /action="https:\/\/formspree.io\/f\/myeybdge"/);
  assert.match(html, /name="_gotcha"/);
  assert.match(html, /Join the waitlist/);
  assert.doesNotMatch(html, /Signups opening soon|disabled=""/);
  assert.match(html, /<input(?=[^>]*name="email")(?=[^>]*required="")[^>]*>/);
  assert.match(html, /<input(?=[^>]*name="neighborhood")(?=[^>]*required="")[^>]*>/);
  assert.doesNotMatch(html, /chatgpt\.site|\/api\/waitlist|<!--app-html-->/);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
    assert.ok(match[1].startsWith("/OutRN/"), match[1]);
    await access(resolve(match[1].slice("/OutRN/".length)));
  }
  await access(".nojekyll");
});
test("the prerendered page carries every section and the Saturday example", async () => {
  const html = await readFile("index.html", "utf8");
  for (const id of ["main-content", "try", "waitlist"]) assert.match(html, new RegExp(`id="${id}"`));
  // No clock exists at build time, so the demo is prerendered on its fixed example.
  assert.match(html, /8:00 PM<\/span> on <!-- -->Saturday/);
  assert.match(html, /Three that fit/);
  assert.match(html, /property="og:image" content="https:\/\/elevin01\.github\.io\/OutRN\/public\/og\.png"/);
  await access("public/og.png");
});
