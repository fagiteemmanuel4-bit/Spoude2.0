import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev
export default defineConfig({
  plugins: [
    TanStackRouter(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
});
