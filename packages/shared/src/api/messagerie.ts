import type { EntSupabaseClient } from "../supabase/createClient";

export async function envoyerMessage(
  client: EntSupabaseClient,
  sujet: string,
  corps: string,
  destinataireIds: string[],
) {
  const { data, error } = await client.rpc("envoyer_message", {
    p_sujet: sujet,
    p_corps: corps,
    p_destinataires: destinataireIds,
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

export async function getMessageDetail(client: EntSupabaseClient, messageId: string) {
  const { data, error } = await client
    .from("messages")
    .select(
      "*, expediteur:expediteur_id(nom, prenom, role), message_destinataires(id, destinataire_id, lu, lu_le, profiles:destinataire_id(nom, prenom, role))",
    )
    .eq("id", messageId)
    .single();
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
