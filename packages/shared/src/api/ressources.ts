import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables } from "../types/database.types";

export type RessourcePedagogique = Tables<"ressources_pedagogiques">;

const BUCKET = "ressources-pedagogiques";

export async function getRessources(client: EntSupabaseClient, matiereClasseId: string) {
  const { data, error } = await client
    .from("ressources_pedagogiques")
    .select("*")
    .eq("matiere_classe_id", matiereClasseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Vue élève/parent : toutes les matières de la classe confondues. */
export async function getRessourcesClasse(client: EntSupabaseClient, classeId: string) {
  const { data, error } = await client
    .from("ressources_pedagogiques")
    .select("*, matiere_classe!inner(classe_id, matieres(nom))")
    .eq("matiere_classe.classe_id", classeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface UploadRessourceInput {
  matiereClasseId: string;
  professeurId: string;
  titre: string;
  file: File | Blob;
}

export async function uploadRessource(client: EntSupabaseClient, input: UploadRessourceInput) {
  const nomFichier = input.file instanceof File ? input.file.name : "fichier";
  const chemin = `${input.matiereClasseId}/${crypto.randomUUID()}-${nomFichier}`;

  const { error: uploadError } = await client.storage.from(BUCKET).upload(chemin, input.file, {
    contentType: input.file.type || undefined,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await client
    .from("ressources_pedagogiques")
    .insert({
      matiere_classe_id: input.matiereClasseId,
      professeur_id: input.professeurId,
      titre: input.titre,
      chemin_fichier: chemin,
      type_mime: input.file.type || null,
      taille_octets: input.file.size,
    })
    .select()
    .single();

  if (error) {
    await client.storage.from(BUCKET).remove([chemin]);
    throw error;
  }

  return data;
}

export async function deleteRessource(client: EntSupabaseClient, id: string, cheminFichier: string) {
  const { error: storageError } = await client.storage.from(BUCKET).remove([cheminFichier]);
  if (storageError) throw storageError;

  const { error } = await client.from("ressources_pedagogiques").delete().eq("id", id);
  if (error) throw error;
}

export async function getRessourceSignedUrl(client: EntSupabaseClient, cheminFichier: string) {
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(cheminFichier, 3600);
  if (error) throw error;
  return data.signedUrl;
}
