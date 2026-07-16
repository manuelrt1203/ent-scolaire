import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables, TablesInsert } from "../types/database.types";

export type VieScolaireEvenement = Tables<"vie_scolaire_evenements">;

export async function getVieScolaireEleve(client: EntSupabaseClient, eleveId: string) {
  const { data, error } = await client
    .from("vie_scolaire_evenements")
    .select("*, creneau:creneau_id(matiere_classe(matieres(nom)))")
    .eq("eleve_id", eleveId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

/** Vue professeur/direction : tous les événements d'une classe, avec le nom
 * de l'élève concerné. */
export async function getVieScolaireClasse(client: EntSupabaseClient, classeId: string) {
  const { data, error } = await client
    .from("vie_scolaire_evenements")
    .select("*, profiles:eleve_id(nom, prenom)")
    .eq("classe_id", classeId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEvenementVieScolaire(
  client: EntSupabaseClient,
  evenement: TablesInsert<"vie_scolaire_evenements">,
) {
  const { data, error } = await client.from("vie_scolaire_evenements").insert(evenement).select().single();
  if (error) throw error;
  return data;
}

/** Direction uniquement (RLS) : justifie/modifie le motif d'une absence ou d'un retard. */
export async function justifierEvenement(client: EntSupabaseClient, id: string, justifie: boolean, motif?: string) {
  const { error } = await client.from("vie_scolaire_evenements").update({ justifie, motif }).eq("id", id);
  if (error) throw error;
}

export async function deleteEvenementVieScolaire(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("vie_scolaire_evenements").delete().eq("id", id);
  if (error) throw error;
}
