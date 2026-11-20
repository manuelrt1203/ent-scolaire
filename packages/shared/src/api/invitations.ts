import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables } from "../types/database.types";

export type Invitation = Tables<"invitations">;

/** Génère un code lisible (8 caractères hexadécimaux majuscules) — pas
 * besoin d'unicité garantie côté client, la contrainte unique en base
 * rejettera une collision (extrêmement improbable sur cet espace). */
function genererCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function getInvitations(client: EntSupabaseClient) {
  const { data, error } = await client
    .from("invitations")
    .select("*, classes(nom, niveau, serie), eleve:eleve_id(nom, prenom)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface CreateInvitationInput {
  etablissementId: string;
  role: Invitation["role"];
  classeId?: string;
  eleveId?: string;
  createdBy: string;
}

export async function createInvitation(client: EntSupabaseClient, input: CreateInvitationInput) {
  const { data, error } = await client
    .from("invitations")
    .insert({
      etablissement_id: input.etablissementId,
      role: input.role,
      classe_id: input.classeId ?? null,
      eleve_id: input.eleveId ?? null,
      created_by: input.createdBy,
      code: genererCode(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvitation(client: EntSupabaseClient, id: string) {
  const { error } = await client.from("invitations").delete().eq("id", id);
  if (error) throw error;
}
