import type { EntSupabaseClient } from "../supabase/createClient";
import type { Enums, Tables, TablesInsert } from "../types/database.types";

export type Classe = Tables<"classes">;
export type Matiere = Tables<"matieres">;
export type MatiereClasse = Tables<"matiere_classe">;
export type Affectation = Tables<"affectations">;
export type Inscription = Tables<"inscriptions">;
export type LienParentEleve = Tables<"liens_parents_eleves">;
export type Role = Enums<"role_utilisateur">;

export async function getAnneeScolaireActive(client: EntSupabaseClient, etablissementId: string) {
  const { data, error } = await client
    .from("annees_scolaires")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("est_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getClasses(client: EntSupabaseClient) {
  const { data, error } = await client.from("classes").select("*").order("nom");
  if (error) throw error;
  return data;
}

export async function createClasse(client: EntSupabaseClient, classe: TablesInsert<"classes">) {
  const { data, error } = await client.from("classes").insert(classe).select().single();
  if (error) throw error;
  return data;
}

export async function getMatieres(client: EntSupabaseClient) {
  const { data, error } = await client.from("matieres").select("*").order("nom");
  if (error) throw error;
  return data;
}

export async function createMatiere(client: EntSupabaseClient, matiere: TablesInsert<"matieres">) {
  const { data, error } = await client.from("matieres").insert(matiere).select().single();
  if (error) throw error;
  return data;
}

export async function getMatiereClasses(client: EntSupabaseClient, classeId?: string) {
  let query = client
    .from("matiere_classe")
    .select("*, matieres(nom, code), classes(nom, niveau)")
    .order("id");
  if (classeId) query = query.eq("classe_id", classeId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMatiereClasse(
  client: EntSupabaseClient,
  matiereClasse: TablesInsert<"matiere_classe">,
) {
  const { data, error } = await client.from("matiere_classe").insert(matiereClasse).select().single();
  if (error) throw error;
  return data;
}

export async function getAffectations(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("affectations")
    .select("*, profiles(nom, prenom), matiere_classe(*, matieres(nom), classes(nom))");
  if (error) throw error;
  return data;
}

export async function createAffectation(client: EntSupabaseClient, professeurId: string, matiereClasseId: string) {
  const { data, error } = await client
    .from("affectations")
    .insert({ professeur_id: professeurId, matiere_classe_id: matiereClasseId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInscriptions(client: EntSupabaseClient, classeId?: string) {
  let query = client.from("inscriptions").select("*, profiles(nom, prenom, email)");
  if (classeId) query = query.eq("classe_id", classeId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createInscription(client: EntSupabaseClient, inscription: TablesInsert<"inscriptions">) {
  const { data, error } = await client.from("inscriptions").insert(inscription).select().single();
  if (error) throw error;
  return data;
}

export async function getUtilisateurs(client: EntSupabaseClient, role?: Role) {
  let query = client.from("profiles").select("*").order("nom");
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createLienParentEleve(client: EntSupabaseClient, parentId: string, eleveId: string) {
  const { data, error } = await client
    .from("liens_parents_eleves")
    .insert({ parent_id: parentId, eleve_id: eleveId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLiensParentsEleves(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("liens_parents_eleves")
    .select("*, parent:parent_id(nom, prenom), eleve:eleve_id(nom, prenom)");
  if (error) throw error;
  return data;
}

/** Classe actuelle d'un élève (RLS inscriptions_select : l'élève lui-même, son
 * parent, un professeur de la classe, ou la direction). Utilisé côté mobile
 * pour résoudre la classe d'un élève/enfant avant de filtrer emploi du temps
 * et cahier de textes. */
export async function getClasseEleve(client: EntSupabaseClient, eleveId: string) {
  const { data, error } = await client
    .from("inscriptions")
    .select("classe_id, classes(id, nom, niveau)")
    .eq("eleve_id", eleveId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Enfants du parent connecté (RLS liens_select : parent_id = auth.uid()). */
export async function getMesEnfants(client: EntSupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const { data, error } = await client
    .from("liens_parents_eleves")
    .select("eleve_id, eleve:eleve_id(id, nom, prenom)")
    .eq("parent_id", user.id);
  if (error) throw error;
  return data;
}

export interface InviteUserInput {
  email: string;
  role: Role;
  nom: string;
  prenom: string;
}

/** Provisionne un compte via l'edge function admin-create-user (clé service-role
 * côté serveur uniquement). Échoue si l'appelant n'a pas le rôle direction. */
export async function inviteUser(client: EntSupabaseClient, input: InviteUserInput) {
  const { data, error } = await client.functions.invoke("admin-create-user", { body: input });
  if (error) throw error;
  return data;
}
