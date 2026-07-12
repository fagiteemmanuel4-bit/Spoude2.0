import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Plain, standard Vite SPA build. No SSR, no Nitro, no Lovable tooling —
// this is a client-side-only React app that builds to a static dist/
// folder, deployable to any static host (Firebase Hosting, Netlify,
// Cloudflare Pages, S3, GitHub Pages, etc.) with zero server config.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
