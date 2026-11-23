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

export async function getExceptionsCreneaux(client: EntSupabaseClient, ids: string[], debut: string, fin = debut) {
  const exceptions: Tables<"exceptions_creneaux">[] = [];
  const taillePage = 500;
  for (let position = 0; position < ids.length; position += 100) {
    const lot = ids.slice(position, position + 100);
    for (let debutPage = 0; ; debutPage += taillePage) {
      const { data, error } = await client.from("exceptions_creneaux")
        .select("*").in("creneau_id", lot).gte("date", debut).lte("date", fin)
        .order("creneau_id").order("date").range(debutPage, debutPage + taillePage - 1);
      if (error) throw error;
      exceptions.push(...data);
      if (data.length < taillePage) break;
    }
  }
  return exceptions;
}

export async function planifierExceptionCreneau(client: EntSupabaseClient, changement: {
  creneauId: string;
  date: string;
  action: "modifier" | "annuler" | "retablir";
  debut?: string;
  fin?: string;
  salle?: string;
}) {
  const { error } = await client.rpc("planifier_exception_creneau", {
    p_creneau_id: changement.creneauId, p_date: changement.date, p_action: changement.action,
    p_debut: changement.debut ?? null, p_fin: changement.fin ?? null, p_salle: changement.salle ?? null,
  });
  if (error) throw error;
}

export function appliquerExceptionCreneau<T extends Pick<Creneau, "heure_debut" | "heure_fin" | "salle">>(
  creneau: T, exception?: Tables<"exceptions_creneaux">,
): T {
  if (!exception || exception.annule) return creneau;
  return { ...creneau, heure_debut: exception.heure_debut!, heure_fin: exception.heure_fin!, salle: exception.salle };
}

export function dateCreneauSemaine(lundi: string, jour: number) {
  const date = new Date(`${lundi}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jour - 1);
  return date.toISOString().slice(0, 10);
}

export function lundiDuCreneau(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const instant = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== date) return null;
  return dateCreneauSemaine(date, 2 - (instant.getUTCDay() || 7));
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
  const exceptions = await getExceptionsCreneaux(client, creneaux.map(({ id }) => id), date);
  const parCreneau = new Map(exceptions.map((exception) => [exception.creneau_id, exception]));
  const seances = creneaux.filter(({ id }) => !parCreneau.get(id)?.annule)
    .map((creneau) => appliquerExceptionCreneau(creneau, parCreneau.get(creneau.id)))
    .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
  if (!seances.length) return [];
  const { data, error } = await client.from("appels_seances")
    .select("creneau_id").eq("date", date).in("creneau_id", seances.map(({ id }) => id));
  if (error) throw error;
  const enregistres = new Set(data.map(({ creneau_id }) => creneau_id));
  return seances.map((creneau) => ({ creneau, enregistre: enregistres.has(creneau.id) }));
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
