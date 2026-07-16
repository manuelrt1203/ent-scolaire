import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert } from "../types/database.types";

export type Actualite = Tables<"actualites">;

export async function getActualites(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("actualites")
    .select("*, auteur:auteur_id(nom, prenom)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createActualite(client: EntSupabaseClient, actualite: TablesInsert<"actualites">) {
  const { data, error } = await client.from("actualites").insert(actualite).select().single();
  if (error) throw error;
  return data;
}

export async function deleteActualite(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("actualites").delete().eq("id", id);
  if (error) throw error;
}
