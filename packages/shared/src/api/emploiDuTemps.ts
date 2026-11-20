import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert } from "../types/database.types";

export type Creneau = Tables<"creneaux">;

/** Créneaux visibles par l'appelant (RLS scope déjà : direction = tout
 * l'établissement, professeur = ses propres créneaux, élève/parent = ceux
 * de leur classe). matiereClasseId filtre une matière précise (écran de
 * gestion direction), classeId filtre toutes les matières d'une classe
 * (emploi du temps complet élève/parent — un parent avec plusieurs enfants
 * voit sinon le mélange des classes de tous ses enfants). */
export async function getCreneaux(
  client: EntSupabaseClient,
  filter?: { matiereClasseId?: string; classeId?: string },
) {
  let query = client
    .from("creneaux")
    .select("*, matiere_classe!inner(*, matieres(nom), classes(nom, niveau, serie)), professeur:professeur_id(nom, prenom)")
    .order("jour_semaine")
    .order("heure_debut");
  if (filter?.matiereClasseId) query = query.eq("matiere_classe_id", filter.matiereClasseId);
  if (filter?.classeId) query = query.eq("matiere_classe.classe_id", filter.classeId);
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
