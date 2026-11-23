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
  filter?: { matiereClasseId?: string; classeId?: string; jourSemaine?: number },
) {
  let query = client
    .from("creneaux")
    .select("*, matiere_classe!inner(*, matieres(nom), classes(nom, niveau, serie)), professeur:profiles!professeur_id(nom, prenom)")
    .order("jour_semaine")
    .order("heure_debut");
  if (filter?.matiereClasseId) query = query.eq("matiere_classe_id", filter.matiereClasseId);
  if (filter?.classeId) query = query.eq("matiere_classe.classe_id", filter.classeId);
  if (filter?.jourSemaine) query = query.eq("jour_semaine", filter.jourSemaine);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getSuiviAppelsClasse(client: EntSupabaseClient, classeId: string, anneeId: string, date: string) {
  const jour = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (Number.isNaN(jour) || jour === 0) return [];
  const { data: annee, error: erreurAnnee } = await client.from("annees_scolaires")
    .select("date_debut, date_fin").eq("id", anneeId).single();
  if (erreurAnnee) throw erreurAnnee;
  if (date < annee.date_debut || date > annee.date_fin) return [];

  const creneaux = await getCreneaux(client, { classeId, jourSemaine: jour });
  if (!creneaux.length) return [];
  const { data, error } = await client.from("appels_seances")
    .select("creneau_id").eq("date", date).in("creneau_id", creneaux.map(({ id }) => id));
  if (error) throw error;
  const enregistres = new Set(data.map(({ creneau_id }) => creneau_id));
  return creneaux.map((creneau) => ({ creneau, enregistre: enregistres.has(creneau.id) }));
}

export async function createCreneau(client: EntSupabaseClient, creneau: TablesInsert<"creneaux">) {
  const { data, error } = await client.from("creneaux").insert(creneau).select().single();
  if (error) throw error;
  return data;
}

export async function updateCreneau(client: EntSupabaseClient, creneauId: string, creneau: TablesInsert<"creneaux">) {
  const { data, error } = await client.from("creneaux").update(creneau).eq("id", creneauId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCreneau(client: EntSupabaseClient, creneauId: string) {
  const { error } = await client.from("creneaux").delete().eq("id", creneauId).select("id").single();
  if (error) throw error;
}
