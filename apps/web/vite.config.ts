import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Sépare les dépendances tierces (peu de changement d'une release à
        // l'autre) du code applicatif (change souvent) : le navigateur met
        // ce chunk en cache longue durée et n'a pas à le retélécharger à
        // chaque mise à jour de l'app — appréciable sur une connexion
        // limitée en données.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          "react-query": ["@tanstack/react-query"],
        },
      },
    },
  },
});
