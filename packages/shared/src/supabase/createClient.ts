import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

export type EntSupabaseClient = SupabaseClient<Database>;

export interface StorageLike {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

export interface CreateClientOptions {
  url: string;
  anonKey: string;
  /** Requis côté React Native (AsyncStorage). Omis côté Electron : le renderer
   * est un environnement DOM, supabase-js utilise localStorage par défaut. */
  storage?: StorageLike;
  persistSession?: boolean;
}

export function createClient({ url, anonKey, storage, persistSession = true }: CreateClientOptions): EntSupabaseClient {
  return createSupabaseClient<Database>(url, anonKey, {
    auth: storage
      ? {
          storage,
          autoRefreshToken: true,
          persistSession,
          detectSessionInUrl: false,
        }
      : {
          autoRefreshToken: true,
          persistSession,
        },
  });
}
