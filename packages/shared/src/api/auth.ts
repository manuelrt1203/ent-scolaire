import type { PaysCalendrier } from "../domain/calendrierLocal";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { Tables } from "../types/database.types";

export type Profile = Tables<"profiles">;

export async function signIn(client: EntSupabaseClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(client: EntSupabaseClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getProfile(client: EntSupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// Activation de compte ("première connexion") : la fiche profiles et le
// compte Auth existent déjà (créés par la direction, voir inviteUser dans
// api/structure.ts). shouldCreateUser: false garantit qu'aucun compte n'est
// créé à la volée — un code n'est envoyé que si l'email correspond déjà à
// un compte existant, ce qui empêche toute auto-déclaration de rôle.
export async function requestActivationCode(client: EntSupabaseClient, email: string) {
  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) throw error;
}

export async function verifyActivationCode(client: EntSupabaseClient, email: string, code: string) {
  const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw error;
  return data;
}

export async function setPassword(client: EntSupabaseClient, password: string) {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export interface RegisterEtablissementInput {
  pays?: PaysCalendrier;
  fuseauCalendrier?: string;
  etablissementNom: string;
  etablissementAdresse?: string;
  directionNom: string;
  directionPrenom: string;
  directionEmail: string;
}

/** Inscription self-service d'un nouvel établissement (voir edge function
 * register-etablissement) : crée l'établissement, l'année scolaire active
 * et le premier compte direction, appelable par un visiteur non connecté.
 * Le compte créé s'active ensuite via le flux normal (requestActivationCode). */
export async function registerEtablissement(client: EntSupabaseClient, input: RegisterEtablissementInput) {
  const { data, error } = await client.functions.invoke("register-etablissement", { body: input });
  if (error) throw error;
  return data as { etablissementId: string; directionEmail: string };
}

/** Lookup public d'un code d'invitation (RPC invitation_par_code, contourne
 * RLS volontairement) — utilisé pour afficher "vous rejoignez [École] en
 * tant que [rôle]" avant que la personne ne valide son inscription. */
export async function getInvitationByCode(client: EntSupabaseClient, code: string) {
  const { data, error } = await client.rpc("invitation_par_code", { p_code: code });
  if (error) throw error;
  return data[0] ?? null;
}

export interface RedeemInvitationInput {
  code: string;
  nom: string;
  prenom: string;
  email: string;
}

/** Crée un compte à partir d'un code d'invitation (edge function
 * redeem-invitation) : rôle et rattachement (classe/parent) viennent du
 * code, jamais du visiteur. Appelable sans authentification. */
export async function redeemInvitation(client: EntSupabaseClient, input: RedeemInvitationInput) {
  const { data, error } = await client.functions.invoke("redeem-invitation", { body: input });
  if (error) throw error;
  return data as { email: string };
}
