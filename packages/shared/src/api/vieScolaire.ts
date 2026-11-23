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
    .select("*, profiles!eleve_id(nom, prenom)")
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
  const { data, error } = await client.from("vie_scolaire_evenements")
    .update({ justifie, motif }).eq("id", id).is("justificatif_chemin", null)
    .select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("L’événement a changé. Rechargez la liste pour le traiter.");
}

export async function examinerJustificatif(
  client: EntSupabaseClient,
  decision: { id: string; chemin: string; motifRefus: string | null },
) {
  const motif = decision.motifRefus?.trim() ?? null;
  if (motif === "") throw new Error("Indiquez le motif du refus.");
  // La RLS réserve la modification à la direction de cet établissement.
  const { data, error } = await client.from("vie_scolaire_evenements")
    .update({ justifie: motif === null, justificatif_motif_refus: motif })
    .eq("id", decision.id)
    .eq("justificatif_chemin", decision.chemin)
    .eq("justifie", false)
    .is("justificatif_motif_refus", null)
    .in("type", ["absence", "retard"])
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Le justificatif a déjà été traité ou n’est plus disponible.");
}

export async function deleteEvenementVieScolaire(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("vie_scolaire_evenements").delete().eq("id", id);
  if (error) throw error;
}

const BUCKET_JUSTIFICATIFS = "vie-scolaire-justificatifs";

const FORMATS_JUSTIFICATIF = [
  { mime: "application/pdf", extensions: ["pdf"] },
  { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
  { mime: "image/png", extensions: ["png"] },
  { mime: "image/webp", extensions: ["webp"] },
  { mime: "image/heic", extensions: ["heic"] },
  { mime: "image/heif", extensions: ["heif"] },
];

export const FORMATS_JUSTIFICATIF_ACCEPTES = FORMATS_JUSTIFICATIF
  .flatMap(({ mime, extensions }) => [mime, ...extensions.map((extension) => `.${extension}`)])
  .join(",");

/** Élève concerné ou l'un de ses parents uniquement (policies storage +
 * vérification côté RPC). L'écriture de la colonne passe par la RPC
 * ajouter_justificatif_absence plutôt qu'un update direct de la table, qui
 * n'autorise que la direction (voir migration 0012). */
export async function uploaderJustificatifAbsence(
  client: EntSupabaseClient,
  vieScolaireId: string,
  file: File | Blob,
) {
  const extension = typeof File !== "undefined" && file instanceof File
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;
  const format = FORMATS_JUSTIFICATIF.find(({ mime, extensions }) =>
    file.type && file.type !== "application/octet-stream"
      ? file.type === mime
      : Boolean(extension && extensions.includes(extension))
  );
  if (!format) throw new Error("Choisissez une photo (JPG, PNG, WebP, HEIC ou HEIF) ou un fichier PDF.");
  if (file.size === 0) throw new Error("Le fichier est vide. Choisissez une autre photo ou un autre PDF.");

  const chemin = `${vieScolaireId}/${crypto.randomUUID()}.${format.extensions[0]}`;
  const { error: uploadError } = await client.storage.from(BUCKET_JUSTIFICATIFS).upload(chemin, file.slice(0, file.size, format.mime), {
    contentType: format.mime,
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
