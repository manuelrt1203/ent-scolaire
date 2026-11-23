import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { EntSupabaseClient } from "../supabase/createClient";
import { getProfile, signIn as apiSignIn, signOut as apiSignOut, type Profile } from "../api/auth";

interface AuthContextValue {
  client: EntSupabaseClient;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ client, children }: { client: EntSupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Évite les appels concurrents à getProfile (deux événements auth successifs
  // — ex. SIGNED_IN puis TOKEN_REFRESHED — ne doivent pas déclencher deux
  // requêtes en vol pour le même utilisateur en même temps).
  const loadedProfileUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let profilDiffere: ReturnType<typeof setTimeout> | undefined;
    loadedProfileUserId.current = null;

    async function loadProfileIfNeeded(userId: string) {
      if (loadedProfileUserId.current === userId) return;
      loadedProfileUserId.current = userId;
      try {
        const p = await getProfile(client, userId);
        if (mounted && loadedProfileUserId.current === userId) setProfile(p);
      } catch (err) {
        console.error("[auth] Échec du chargement du profil :", err);
        if (mounted && loadedProfileUserId.current === userId) {
          loadedProfileUserId.current = null;
          setProfile(null);
        }
      }
    }

    async function loadInitialSession() {
      try {
        const {
          data: { session: current },
        } = await client.auth.getSession();
        if (!mounted) return;
        setSession(current);
        if (current) await loadProfileIfNeeded(current.user.id);
      } catch (err) {
        console.error("[auth] Échec du chargement de la session/profil :", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInitialSession();

    const { data: subscription } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      clearTimeout(profilDiffere);
      if (loadedProfileUserId.current !== newSession?.user.id) {
        loadedProfileUserId.current = null;
        setProfile(null);
      }
      if (newSession) {
        // La requête du profil utilise la session Supabase. Elle doit démarrer
        // après la fin du callback d’authentification, hors du verrou interne.
        profilDiffere = setTimeout(() => {
          if (mounted) void loadProfileIfNeeded(newSession.user.id);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(profilDiffere);
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  async function signIn(email: string, password: string) {
    await apiSignIn(client, email, password);
  }

  async function signOut() {
    await apiSignOut(client);
  }

  return (
    <AuthContext.Provider value={{ client, session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}
