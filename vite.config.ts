import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  build: {
    outDir: resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer/src"),
    },
    dedupe: ["three"],
  },
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
