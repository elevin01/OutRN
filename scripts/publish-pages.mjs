import { readFile, writeFile, cp, mkdir, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const { render } = await import(new URL("../.pages-ssr/prerender.js", import.meta.url));
const template = await readFile(resolve(root, ".pages-build/index.html"), "utf8");
if (!template.includes("<!--app-html-->")) throw new Error("Missing prerender placeholder");
let html = template.replace("<!--app-html-->", render());
if (!html.includes('aria-label="Got free time? Try going out Right Now."') || !html.includes('id="waitlist"')) throw new Error("Landing page failed to prerender");
// Netlify serves at the domain root. Use its production URL for canonical metadata.
if (process.env.SITE_TARGET === "netlify") {
  const siteUrl = process.env.SITE_URL || process.env.URL;
  const canonical = siteUrl ? new URL("/", siteUrl).href.replaceAll("&", "&amp;").replaceAll('"', "&quot;") : null;
  html = html.replace(/<link rel="canonical"[^>]*>/, canonical ? `<link rel="canonical" href="${canonical}" />` : "");
}

// Every publish folder must be self-contained, including prerendered content and
// assets intentionally kept outside Vite's module graph (photos and theme init).
await writeFile(resolve(root, ".pages-build/index.html"), html);
await cp(resolve(root, "public"), resolve(root, ".pages-build/public"), { recursive: true });

if (process.env.SITE_TARGET !== "netlify") {
  await mkdir(resolve(root, "site-assets"), { recursive: true });
  for (const file of await readdir(resolve(root, "site-assets"))) {
    if (/^index-[\w-]+\.(js|css)$/.test(file)) await unlink(resolve(root, "site-assets", file));
  }
  await cp(resolve(root, ".pages-build/site-assets"), resolve(root, "site-assets"), { recursive: true });
  await writeFile(resolve(root, "index.html"), html);
  await writeFile(resolve(root, ".nojekyll"), "");
  console.log("GitHub Pages entry point and static assets are ready.");
} else {
  console.log("Netlify static site is ready in .pages-build.");
}
