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

export async function getProfile(client: EntSupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// Activation de compte ("première connexion") : la fiche profiles et le
// compte Auth existent déjà (créés par la direction, voir inviteUser dans
// api/structure.ts). shouldCreateUser: false garantit qu'aucun compte n'est
// créé à la volée — un code n'est envoyé que si l'email correspond déjà à
// un compte existant, ce qui empêche toute auto-déclaration de rôle.
export async function requestActivationCode(client: EntSupabaseClient, email: string) {
  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) throw error;
}

export async function verifyActivationCode(client: EntSupabaseClient, email: string, code: string) {
  const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw error;
  return data;
}

export async function setPassword(client: EntSupabaseClient, password: string) {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}
