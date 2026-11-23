import type { EntSupabaseClient } from "../supabase/createClient";
import { appliquerExceptionCreneau } from "./emploiDuTemps";
import { libelleClasse } from "../domain/classe";
import type { Tables, TablesInsert } from "../types/database.types";

export type VieScolaireEvenement = Tables<"vie_scolaire_evenements">;

export async function getVieScolaireEleve(client: EntSupabaseClient, eleveId: string) {
  const { data, error } = await client
    .from("vie_scolaire_evenements")
    .select("*, creneau:creneaux!creneau_id(heure_debut, heure_fin, salle, exceptions_creneaux(*), matiere_classe(matieres(nom), classes(nom, niveau, serie)))")
    .eq("eleve_id", eleveId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(({ creneau, ...evenement }) => {
    if (!creneau) return { ...evenement, creneau: null };
    const { exceptions_creneaux, ...cours } = creneau;
    const exception = exceptions_creneaux?.find(({ date }) => date === evenement.date);
    return { ...evenement, creneau: appliquerExceptionCreneau(cours, exception) };
  });
}

export function libelleSeanceVieScolaire(creneau: Awaited<ReturnType<typeof getVieScolaireEleve>>[number]["creneau"]): string {
  if (!creneau) return "";
  return [
    creneau.matiere_classe?.matieres?.nom,
    libelleClasse(creneau.matiere_classe?.classes),
    `${creneau.heure_debut.slice(0, 5)}–${creneau.heure_fin.slice(0, 5)}`,
  ].filter(Boolean).join(" · ");
}

export type FiltreVieScolaireSeance = { creneauId: string; date: string };

/** Événements d'une classe, avec le nom de l'élève concerné. */
export async function getVieScolaireClasse(
  client: EntSupabaseClient, classeId: string, seance?: FiltreVieScolaireSeance,
) {
  let query = client
    .from("vie_scolaire_evenements")
    .select("*, profiles!eleve_id(nom, prenom)")
    .eq("classe_id", classeId)
    .order("date", { ascending: false });
  if (seance) {
    query = query.eq("date", seance.date).eq("creneau_id", seance.creneauId).in("type", ["absence", "retard"]);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type PresenceSeance = {
  eleve_id: string;
  statut: "present" | "absence" | "retard";
  minutes: number | null;
};

export async function getAppelSeance(client: EntSupabaseClient, creneauId: string, date: string) {
  const { data: appel, error: erreurAppel } = await client.from("appels_seances")
    .select("version").eq("creneau_id", creneauId).eq("date", date).maybeSingle();
  if (erreurAppel) throw erreurAppel;
  const { data: evenements, error } = await client.from("vie_scolaire_evenements")
    .select("eleve_id, type, duree_minutes, justifie, justificatif_chemin")
    .eq("creneau_id", creneauId).eq("date", date).in("type", ["absence", "retard"]);
  if (error) throw error;
  return { version: appel?.version ?? 0, evenements };
}

export async function enregistrerAppelSeance(
  client: EntSupabaseClient,
  creneauId: string,
  date: string,
  version: number,
  presences: PresenceSeance[],
) {
  const { error } = await client.rpc("enregistrer_appel_seance", {
    p_creneau_id: creneauId,
    p_date: date,
    p_version: version,
    p_presences: presences,
  });
  if (error) throw error;
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

export const TYPES_MIME_JUSTIFICATIF = FORMATS_JUSTIFICATIF.map(({ mime }) => mime);

export type FichierJustificatif = (Blob & { name?: string }) | {
  donnees: ArrayBuffer;
  name: string;
  type: string;
  uuid: string;
};

export const FORMATS_JUSTIFICATIF_ACCEPTES = FORMATS_JUSTIFICATIF
  .flatMap(({ mime, extensions }) => [mime, ...extensions.map((extension) => `.${extension}`)])
  .join(",");

/** Élève concerné ou l'un de ses parents uniquement (policies storage +
 * vérification côté RPC). L'écriture de la colonne passe par la RPC
 * ajouter_justificatif_absence plutôt qu'un update direct de la table, qui
 * n'autorise que la direction. */
export async function uploaderJustificatifAbsence(
  client: EntSupabaseClient,
  vieScolaireId: string,
  file: FichierJustificatif,
) {
  const extension = file.name?.split(".").pop()?.toLowerCase();
  const format = FORMATS_JUSTIFICATIF.find(({ mime, extensions }) =>
    file.type && file.type !== "application/octet-stream"
      ? file.type === mime
      : Boolean(extension && extensions.includes(extension))
  );
  if (!format) throw new Error("Choisissez une photo (JPG, PNG, WebP, HEIC ou HEIF) ou un fichier PDF.");
  const taille = "donnees" in file ? file.donnees.byteLength : file.size;
  if (taille === 0) throw new Error("Le fichier est vide. Choisissez une autre photo ou un autre PDF.");

  const uuid = "donnees" in file ? file.uuid : crypto.randomUUID();
  const chemin = `${vieScolaireId}/${uuid}.${format.extensions[0]}`;
  const contenu = "donnees" in file ? file.donnees : file.slice(0, file.size, format.mime);
  const { error: uploadError } = await client.storage.from(BUCKET_JUSTIFICATIFS).upload(chemin, contenu, {
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
