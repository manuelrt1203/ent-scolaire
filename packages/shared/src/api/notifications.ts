import type { EntSupabaseClient } from "../supabase/createClient";

/** Les lignes sont créées uniquement par des triggers côté base (note
 * publiée, actualité, cahier de textes, vie scolaire) — voir la migration
 * 20260916204628_notifications.sql. Le client ne fait jamais d'insert ici. */
export async function getNotifications(client: EntSupabaseClient, limit = 30) {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getNombreNotificationsNonLues(client: EntSupabaseClient) {
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("lu", false);
  if (error) throw error;
  return count ?? 0;
}

export async function marquerNotificationCommeLue(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("notifications").update({ lu: true }).eq("id", id);
  if (error) throw error;
}

export async function marquerToutesNotificationsCommeLues(client: EntSupabaseClient) {
  const { error } = await client.from("notifications").update({ lu: true }).eq("lu", false);
  if (error) throw error;
}
