import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: resolve(import.meta.dirname, "web"),
  base: "/OutRN/",
  publicDir: false,
  plugins: [react()],
  resolve: { alias: { "@": resolve(import.meta.dirname) } },
  build: {
    outDir: resolve(import.meta.dirname, ".pages-build"),
    emptyOutDir: true,
    assetsDir: "site-assets",
  },
});
