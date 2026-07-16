import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert, TablesUpdate } from "../types/database.types";

export type CahierTexteEntree = Tables<"cahier_texte">;

export async function getCahierTexteMatiereClasse(client: EntSupabaseClient, matiereClasseId: string) {
  const { data, error } = await client
    .from("cahier_texte")
    .select("*")
    .eq("matiere_classe_id", matiereClasseId)
    .order("date_seance", { ascending: false });
  if (error) throw error;
  return data;
}

/** Vue élève/parent : toutes les matières de la classe confondues. */
export async function getCahierTexteClasse(client: EntSupabaseClient, classeId: string) {
  const { data, error } = await client
    .from("cahier_texte")
    .select("*, matiere_classe!inner(classe_id, matieres(nom))")
    .eq("matiere_classe.classe_id", classeId)
    .order("date_seance", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEntreeCahierTexte(client: EntSupabaseClient, entree: TablesInsert<"cahier_texte">) {
  const { data, error } = await client.from("cahier_texte").insert(entree).select().single();
  if (error) throw error;
  return data;
}

export async function updateEntreeCahierTexte(
  client: EntSupabaseClient,
  id: string,
  entree: TablesUpdate<"cahier_texte">,
) {
  const { data, error } = await client.from("cahier_texte").update(entree).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEntreeCahierTexte(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("cahier_texte").delete().eq("id", id);
  if (error) throw error;
}
