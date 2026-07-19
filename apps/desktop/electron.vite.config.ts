import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron/main",
      rollupOptions: { input: path.resolve(__dirname, "src/main/index.ts") },
    },
  },
  preload: {
    build: {
      outDir: "dist-electron/preload",
      rollupOptions: { input: path.resolve(__dirname, "src/preload/index.ts") },
    },
  },
  renderer: {
    // Le renderer réutilise directement le code source de apps/web (React +
    // Tailwind, sans rien de spécifique à Electron : le preload est vide,
    // le renderer parle à Supabase en HTTPS). Une seule base de code pour
    // la version web (déployée) et la version desktop (packagée Electron).
    root: path.resolve(__dirname, "../web"),
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, "dist-electron/renderer"),
      rollupOptions: { input: path.resolve(__dirname, "../web/index.html") },
    },
  },
});
