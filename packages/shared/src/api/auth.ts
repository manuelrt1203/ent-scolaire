import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables } from "../types/database.types";

export type Profile = Tables<"profiles">;

export async function signIn(client: EntSupabaseClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(client: EntSupabaseClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getProfile(client: EntSupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}
