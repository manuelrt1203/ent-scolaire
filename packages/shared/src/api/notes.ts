import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables } from "../types/database.types";

export type ReleveNotes = Tables<"releves_notes">;
export type Note = Tables<"notes">;

/** Matières/classes affectées au professeur connecté (RLS restreint déjà aux
 * lignes du prof appelant). */
export async function getMesAffectations(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("affectations")
    .select("*, matiere_classe(*, matieres(nom, code), classes(nom, niveau))");
  if (error) throw error;
  return data;
}

async function syncNotesForReleve(client: EntSupabaseClient, releveId: string, matiereClasseId: string) {
  const { data: mc, error: mcErr } = await client
    .from("matiere_classe")
    .select("classe_id")
    .eq("id", matiereClasseId)
    .single();
  if (mcErr) throw mcErr;

  const { data: inscriptions, error: inscErr } = await client
    .from("inscriptions")
    .select("eleve_id")
    .eq("classe_id", mc.classe_id);
  if (inscErr) throw inscErr;

  const { data: existing, error: notesErr } = await client
    .from("notes")
    .select("eleve_id")
    .eq("releve_id", releveId);
  if (notesErr) throw notesErr;

  const existingIds = new Set(existing.map((n) => n.eleve_id));
  const missing = inscriptions.filter((i) => !existingIds.has(i.eleve_id));
  if (missing.length === 0) return;

  const { error: insertErr } = await client
    .from("notes")
    .insert(missing.map((i) => ({ releve_id: releveId, eleve_id: i.eleve_id })));
  if (insertErr) throw insertErr;
}

/** Récupère le relevé brouillon/existant pour une matière-classe et une période,
 * en le créant si besoin, et s'assure qu'une ligne "notes" existe pour chaque
 * élève inscrit (idempotent : n'ajoute que les élèves manquants). */
export async function getReleveOrCreate(
  client: EntSupabaseClient,
  matiereClasseId: string,
  periodeId: string,
): Promise<ReleveNotes> {
  const { data: existing, error: selErr } = await client
    .from("releves_notes")
    .select("*")
    .eq("matiere_classe_id", matiereClasseId)
    .eq("periode_id", periodeId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    await syncNotesForReleve(client, existing.id, matiereClasseId);
    return existing;
  }

  const { data: created, error: insErr } = await client
    .from("releves_notes")
    .insert({ matiere_classe_id: matiereClasseId, periode_id: periodeId })
    .select()
    .single();
  if (insErr) throw insErr;

  await syncNotesForReleve(client, created.id, matiereClasseId);
  return created;
}

export async function getReleveById(client: EntSupabaseClient, releveId: string) {
  const { data, error } = await client
    .from("releves_notes")
    .select("*, matiere_classe(*, matieres(nom), classes(nom)), periodes(nom, ordre)")
    .eq("id", releveId)
    .single();
  if (error) throw error;
  return data;
}

export async function getNotesForReleve(client: EntSupabaseClient, releveId: string) {
  const { data, error } = await client
    .from("notes")
    .select("*, profiles(nom, prenom)")
    .eq("releve_id", releveId)
    .order("id");
  if (error) throw error;
  return data;
}

export async function updateNoteValeur(client: EntSupabaseClient, noteId: string, valeur: number | null) {
  const { error } = await client.from("notes").update({ valeur }).eq("id", noteId);
  if (error) throw error;
}

export async function soumettreReleve(client: EntSupabaseClient, releveId: string) {
  const { error } = await client.rpc("soumettre_releve", { p_releve_id: releveId });
  if (error) throw error;
}

export async function validerReleve(client: EntSupabaseClient, releveId: string, commentaire?: string) {
  const { error } = await client.rpc("valider_releve", {
    p_releve_id: releveId,
    p_commentaire: commentaire ?? undefined,
  });
  if (error) throw error;
}

export async function rejeterReleve(client: EntSupabaseClient, releveId: string, commentaire: string) {
  const { error } = await client.rpc("rejeter_releve", { p_releve_id: releveId, p_commentaire: commentaire });
  if (error) throw error;
}

export async function publierReleve(client: EntSupabaseClient, releveId: string) {
  const { error } = await client.rpc("publier_releve", { p_releve_id: releveId });
  if (error) throw error;
}

/** File des relevés à examiner par la direction, avec libellés matière/classe/période. */
export async function getRelevesForDirection(client: EntSupabaseClient, statuts?: ReleveNotes["statut"][]) {
  let query = client
    .from("releves_notes")
    .select("*, matiere_classe(*, matieres(nom), classes(nom)), periodes(nom, ordre)")
    .order("updated_at", { ascending: false });
  if (statuts && statuts.length > 0) query = query.in("statut", statuts);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMoyenneMatiere(
  client: EntSupabaseClient,
  eleveId: string,
  matiereClasseId: string,
  periodeId: string,
) {
  const { data, error } = await client.rpc("calculer_moyenne_matiere", {
    p_eleve_id: eleveId,
    p_matiere_classe_id: matiereClasseId,
    p_periode_id: periodeId,
  });
  if (error) throw error;
  return data;
}

export async function getMoyenneGenerale(client: EntSupabaseClient, eleveId: string, periodeId: string) {
  const { data, error } = await client.rpc("calculer_moyenne_generale", {
    p_eleve_id: eleveId,
    p_periode_id: periodeId,
  });
  if (error) throw error;
  return data;
}

/** Bulletin élève/parent : uniquement les matières publiées (RLS filtre déjà,
 * la vue ne fait qu'agréger ce qui reste visible côté serveur). */
export async function getBulletin(client: EntSupabaseClient, eleveId: string, periodeId: string) {
  const { data, error } = await client
    .from("v_bulletin")
    .select("*")
    .eq("eleve_id", eleveId)
    .eq("periode_id", periodeId);
  if (error) throw error;
  return data;
}

/** Détail des notes individuelles d'un élève pour une matière/période (RLS
 * notes_select_eleve/parent : uniquement si le relevé est publié). Complète
 * getBulletin/v_bulletin qui ne donne que la moyenne agrégée. */
export async function getNotesEleveMatiere(
  client: EntSupabaseClient,
  eleveId: string,
  matiereClasseId: string,
  periodeId: string,
) {
  const { data, error } = await client
    .from("notes")
    .select("*, releves_notes!inner(matiere_classe_id, periode_id, statut)")
    .eq("eleve_id", eleveId)
    .eq("releves_notes.matiere_classe_id", matiereClasseId)
    .eq("releves_notes.periode_id", periodeId);
  if (error) throw error;
  return data;
}

export async function getPeriodes(client: EntSupabaseClient) {
  const { data, error } = await client.from("periodes").select("*").order("ordre");
  if (error) throw error;
  return data;
}
