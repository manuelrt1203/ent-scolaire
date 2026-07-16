import type { EntSupabaseClient } from "../supabase/createClient";

/** Annuaire minimal (nom/prénom/rôle, pas d'email) de tout l'établissement,
 * pour le sélecteur de destinataires — la table profiles reste restreinte
 * par relation pour les écrans d'administration, cette fonction contourne
 * volontairement cette restriction pour cet usage précis. */
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
    .select("*, messages(id, sujet, corps, created_at, expediteur:expediteur_id(nom, prenom, role))")
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
    .select("*, message_destinataires(destinataire_id, lu, profiles:destinataire_id(nom, prenom, role))")
    .eq("expediteur_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

const THREAD_MESSAGE_SELECT =
  "*, expediteur:expediteur_id(nom, prenom, role), message_destinataires(id, destinataire_id, lu, lu_le, profiles:destinataire_id(nom, prenom, role))";

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
