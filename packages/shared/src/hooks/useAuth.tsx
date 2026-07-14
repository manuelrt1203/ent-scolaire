import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      const {
        data: { session: current },
      } = await client.auth.getSession();
      if (!mounted) return;
      setSession(current);
      if (current) {
        const p = await getProfile(client);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    }
    loadInitialSession();

    const { data: subscription } = client.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        const p = await getProfile(client);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
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
