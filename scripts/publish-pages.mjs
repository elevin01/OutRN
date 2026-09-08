import { readFile, writeFile, cp, mkdir, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const { render } = await import(new URL("../.pages-ssr/prerender.js", import.meta.url));
const template = await readFile(resolve(root, ".pages-build/index.html"), "utf8");
if (!template.includes("<!--app-html-->")) throw new Error("Missing prerender placeholder");
const html = template.replace("<!--app-html-->", render());
if (!html.includes("GO LIVE") || !html.includes('id="waitlist"')) throw new Error("Landing page failed to prerender");
await mkdir(resolve(root, "site-assets"), { recursive: true });
for (const file of await readdir(resolve(root, "site-assets"))) {
  if (/^index-[\w-]+\.(js|css)$/.test(file)) await unlink(resolve(root, "site-assets", file));
}
await cp(resolve(root, ".pages-build/site-assets"), resolve(root, "site-assets"), { recursive: true });
await writeFile(resolve(root, "index.html"), html);
await writeFile(resolve(root, ".nojekyll"), "");
console.log("GitHub Pages entry point and static assets are ready.");
