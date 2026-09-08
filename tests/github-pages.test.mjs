import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
test("Pages serves a prerendered landing page with subpath-safe assets", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /GO LIVE/);
  assert.match(html, /Early access is opening soon/);
  assert.doesNotMatch(html, /chatgpt\.site|\/api\/waitlist|<!--app-html-->/);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
    assert.ok(match[1].startsWith("/OutRN/"), match[1]);
    await access(resolve(match[1].slice("/OutRN/".length)));
  }
  await access(".nojekyll");
});
