import type { EntSupabaseClient } from "../supabase/createClient";

const PIECES_JOINTES_BUCKET = "messagerie-pieces-jointes";
const PIECE_JOINTE_SELECT = "id, nom_fichier, chemin_fichier, type_mime, taille_octets";

/** Annuaire de tout l'établissement (nom/prénom/rôle/email), utilisé par le
 * sélecteur de destinataires et par l'écran Annuaire — la table profiles
 * reste restreinte par relation pour les écrans d'administration, cette
 * fonction contourne volontairement cette restriction pour ces usages. */
export async function getAnnuaireMessagerie(client: EntSupabaseClient) {
  const { data, error } = await client.rpc("annuaire_etablissement");
  if (error) throw error;
  return data;
}

export async function envoyerMessage(
  client: EntSupabaseClient,
  sujet: string,
  corps: string,
  destinataireIds: string[],
  parentMessageId?: string,
) {
  const { data, error } = await client.rpc("envoyer_message", {
    p_sujet: sujet,
    p_corps: corps,
    p_destinataires: destinataireIds,
    p_parent_message_id: parentMessageId,
  });
  if (error) throw error;
  return data;
}

export async function getBoiteReception(client: EntSupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const { data, error } = await client
    .from("message_destinataires")
    .select(
      `*, messages(id, sujet, corps, created_at, expediteur:expediteur_id(nom, prenom, role), message_pieces_jointes(${PIECE_JOINTE_SELECT}))`,
    )
    .eq("destinataire_id", user.id)
    .eq("supprime", false)
    .order("created_at", { referencedTable: "messages", ascending: false });
  if (error) throw error;
  return data;
}

export async function getMessagesEnvoyes(client: EntSupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const { data, error } = await client
    .from("messages")
    .select(
      `*, message_destinataires(destinataire_id, lu, profiles:destinataire_id(nom, prenom, role)), message_pieces_jointes(${PIECE_JOINTE_SELECT})`,
    )
    .eq("expediteur_id", user.id)
    .eq("supprime_expediteur", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function supprimerMessageEnvoye(client: EntSupabaseClient, messageId: string) {
  const { error } = await client.rpc("supprimer_message_envoye", { p_message_id: messageId });
  if (error) throw error;
}

const THREAD_MESSAGE_SELECT = `*, expediteur:expediteur_id(nom, prenom, role), message_destinataires(id, destinataire_id, lu, lu_le, profiles:destinataire_id(nom, prenom, role)), message_pieces_jointes(${PIECE_JOINTE_SELECT})`;

/** Fil de discussion complet (message d'origine + toutes les réponses),
 * dans l'ordre chronologique — une réponse pointe toujours vers la racine
 * du fil (jamais vers un message intermédiaire), donc une seule requête
 * "id = racine OU parent_message_id = racine" suffit à tout récupérer. */
export async function getMessageThread(client: EntSupabaseClient, messageId: string) {
  const { data: message, error: msgErr } = await client
    .from("messages")
    .select("id, parent_message_id")
    .eq("id", messageId)
    .single();
  if (msgErr) throw msgErr;

  const rootId = message.parent_message_id ?? message.id;

  const { data, error } = await client
    .from("messages")
    .select(THREAD_MESSAGE_SELECT)
    .or(`id.eq.${rootId},parent_message_id.eq.${rootId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function marquerCommeLu(client: EntSupabaseClient, destinataireRowId: string) {
  const { error } = await client
    .from("message_destinataires")
    .update({ lu: true, lu_le: new Date().toISOString() })
    .eq("id", destinataireRowId);
  if (error) throw error;
}

export async function supprimerDeReception(client: EntSupabaseClient, destinataireRowId: string) {
  const { error } = await client.from("message_destinataires").update({ supprime: true }).eq("id", destinataireRowId);
  if (error) throw error;
}

export interface UploadPieceJointeInput {
  messageId: string;
  file: File | Blob;
  /** Requis côté mobile : un Blob issu de `fetch(uri)` (expo-document-picker)
   * ne porte pas de nom de fichier, contrairement à un File web. */
  nomFichier?: string;
}

/** Le message doit déjà exister (créé via envoyerMessage) avant d'y attacher
 * un fichier : le chemin de stockage encode l'id du message en premier
 * segment, et la policy RLS de storage.objects vérifie que l'appelant en
 * est bien l'expéditeur. */
export async function uploadPieceJointe(client: EntSupabaseClient, input: UploadPieceJointeInput) {
  const nomFichier = input.nomFichier ?? (input.file instanceof File ? input.file.name : "fichier");
  const chemin = `${input.messageId}/${crypto.randomUUID()}-${nomFichier}`;

  const { error: uploadError } = await client.storage.from(PIECES_JOINTES_BUCKET).upload(chemin, input.file, {
    contentType: input.file.type || undefined,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await client
    .from("message_pieces_jointes")
    .insert({
      message_id: input.messageId,
      nom_fichier: nomFichier,
      chemin_fichier: chemin,
      type_mime: input.file.type || null,
      taille_octets: input.file.size,
    })
    .select()
    .single();

  if (error) {
    await client.storage.from(PIECES_JOINTES_BUCKET).remove([chemin]);
    throw error;
  }

  return data;
}

export async function getPieceJointeSignedUrl(client: EntSupabaseClient, cheminFichier: string) {
  const { data, error } = await client.storage.from(PIECES_JOINTES_BUCKET).createSignedUrl(cheminFichier, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getNombreNonLus(client: EntSupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return 0;

  const { count, error } = await client
    .from("message_destinataires")
    .select("id", { count: "exact", head: true })
    .eq("destinataire_id", user.id)
    .eq("supprime", false)
    .eq("lu", false);
  if (error) throw error;
  return count ?? 0;
}
