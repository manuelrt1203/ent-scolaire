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

const BUCKET_JUSTIFICATIFS = "vie-scolaire-justificatifs";

/** Élève concerné ou l'un de ses parents uniquement (policies storage +
 * vérification côté RPC). L'écriture de la colonne passe par la RPC
 * ajouter_justificatif_absence plutôt qu'un update direct de la table, qui
 * n'autorise que la direction (voir migration 0012). */
export async function uploaderJustificatifAbsence(
  client: EntSupabaseClient,
  vieScolaireId: string,
  file: File | Blob,
) {
  const nomFichier = file instanceof File ? file.name : "justificatif";
  const chemin = `${vieScolaireId}/${crypto.randomUUID()}-${nomFichier}`;

  const { error: uploadError } = await client.storage.from(BUCKET_JUSTIFICATIFS).upload(chemin, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) throw uploadError;

  const { error } = await client.rpc("ajouter_justificatif_absence", {
    p_vie_scolaire_id: vieScolaireId,
    p_chemin: chemin,
  });
  if (error) {
    await client.storage.from(BUCKET_JUSTIFICATIFS).remove([chemin]);
    throw error;
  }
}

export async function getJustificatifSignedUrl(client: EntSupabaseClient, cheminFichier: string) {
  const { data, error } = await client.storage.from(BUCKET_JUSTIFICATIFS).createSignedUrl(cheminFichier, 3600);
  if (error) throw error;
  return data.signedUrl;
}
