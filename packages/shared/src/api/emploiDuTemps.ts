import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert } from "../types/database.types";

export type Creneau = Tables<"creneaux">;

/** Créneaux visibles par l'appelant (RLS scope déjà : direction = tout
 * l'établissement, professeur = ses propres créneaux, élève/parent = ceux
 * de leur classe). matiereClasseId filtre en plus côté direction pour
 * l'écran de gestion. */
export async function getCreneaux(client: EntSupabaseClient, matiereClasseId?: string) {
  let query = client
    .from("creneaux")
    .select("*, matiere_classe(*, matieres(nom), classes(nom)), professeur:professeur_id(nom, prenom)")
    .order("jour_semaine")
    .order("heure_debut");
  if (matiereClasseId) query = query.eq("matiere_classe_id", matiereClasseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCreneau(client: EntSupabaseClient, creneau: TablesInsert<"creneaux">) {
  const { data, error } = await client.from("creneaux").insert(creneau).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCreneau(client: EntSupabaseClient, creneauId: string) {
  const { error } = await client.from("creneaux").delete().eq("id", creneauId);
  if (error) throw error;
}
