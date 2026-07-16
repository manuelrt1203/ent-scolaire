import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert } from "../types/database.types";

export type EvenementCalendrier = Tables<"evenements_calendrier">;

export async function getEvenementsCalendrier(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("evenements_calendrier")
    .select("*, auteur:auteur_id(nom, prenom)")
    .order("date_debut");
  if (error) throw error;
  return data;
}

export async function createEvenementCalendrier(
  client: EntSupabaseClient,
  evenement: TablesInsert<"evenements_calendrier">,
) {
  const { data, error } = await client.from("evenements_calendrier").insert(evenement).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvenementCalendrier(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("evenements_calendrier").delete().eq("id", id);
  if (error) throw error;
}
