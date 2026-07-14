import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@ent/shared";
import { supabase } from "./lib/supabaseClient";
import { App } from "./App";
import "./styles.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={supabase}>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
