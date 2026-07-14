import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@ent/shared";
import { supabase } from "./lib/supabaseClient";
import { App } from "./App";
import "./styles.css";

const queryClient = new QueryClient();

// Pas de <StrictMode> : le double-appel des effets qu'il provoque en dev
// entre en conflit avec le verrou interne (navigator.locks) de
// supabase-js@2.45 sur les appels auth.getSession()/getUser() concurrents,
// et bloque indéfiniment l'écran de chargement.
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider client={supabase}>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
