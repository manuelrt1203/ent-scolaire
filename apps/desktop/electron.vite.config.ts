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
    root: path.resolve(__dirname, "src/renderer"),
    plugins: [react()],
    build: {
      outDir: "dist-electron/renderer",
      rollupOptions: { input: path.resolve(__dirname, "src/renderer/index.html") },
    },
  },
});
