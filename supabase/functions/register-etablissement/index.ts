// Inscription self-service d'un nouvel établissement (école) : crée
// etablissements + annees_scolaires + le premier compte direction, en
// utilisant la clé service-role (contourne RLS — c'est la seule façon de
// créer ces lignes, il n'existe aucune policy d'INSERT qui puisse jamais
// passer pour un tout premier établissement, voir 0002_rls_policies.sql).
//
// Contrairement à admin-create-user, cette fonction est appelable par un
// visiteur anonyme (page publique avant toute connexion) : aucune
// vérification d'identité de l'appelant, c'est une action publique de
// type "créer un compte". Le compte direction créé reste inutilisable
// tant qu'il n'a pas été activé via le code envoyé sur sa vraie adresse
// email (même flux "Première connexion" que tout compte invité).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Appelée depuis un navigateur/Electron (contrairement aux scripts Node de
// test qui ne sont pas soumis à CORS) : sans ces headers, le preflight
// OPTIONS échoue et le client voit "Failed to send a request to the Edge
// Function" sans jamais atteindre le code ci-dessous.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function anneeScolaireActive() {
  const now = new Date();
  const moisCourant = now.getMonth() + 1; // 1-12
  const anneeDepart = moisCourant >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    libelle: `${anneeDepart}-${anneeDepart + 1}`,
    date_debut: `${anneeDepart}-09-01`,
    date_fin: `${anneeDepart + 1}-08-31`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  const body = await req.json();
  const { etablissementNom, etablissementAdresse, directionNom, directionPrenom, directionEmail } = body as {
    etablissementNom?: string;
    etablissementAdresse?: string;
    directionNom?: string;
    directionPrenom?: string;
    directionEmail?: string;
  };

  if (!etablissementNom || !directionNom || !directionPrenom || !directionEmail) {
    return json({ error: "etablissementNom, directionNom, directionPrenom et directionEmail sont requis" }, 400);
  }
  if (!EMAIL_RE.test(directionEmail)) {
    return json({ error: "Adresse email invalide" }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: etablissement, error: etablissementError } = await adminClient
    .from("etablissements")
    .insert({ nom: etablissementNom, adresse: etablissementAdresse || null })
    .select()
    .single();
  if (etablissementError) {
    return json({ error: etablissementError.message }, 400);
  }

  const { libelle, date_debut, date_fin } = anneeScolaireActive();
  const { data: anneeScolaire, error: anneeError } = await adminClient
    .from("annees_scolaires")
    .insert({ etablissement_id: etablissement.id, libelle, date_debut, date_fin, est_active: true })
    .select()
    .single();
  if (anneeError) {
    await adminClient.from("etablissements").delete().eq("id", etablissement.id);
    return json({ error: anneeError.message }, 400);
  }

  const tempPassword = crypto.randomUUID();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: directionEmail,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !created.user) {
    await adminClient.from("annees_scolaires").delete().eq("id", anneeScolaire.id);
    await adminClient.from("etablissements").delete().eq("id", etablissement.id);
    return json({ error: createError?.message ?? "Échec de création du compte" }, 400);
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: created.user.id,
    etablissement_id: etablissement.id,
    role: "direction",
    nom: directionNom,
    prenom: directionPrenom,
    email: directionEmail,
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    await adminClient.from("annees_scolaires").delete().eq("id", anneeScolaire.id);
    await adminClient.from("etablissements").delete().eq("id", etablissement.id);
    return json({ error: profileError.message }, 400);
  }

  return json({ etablissementId: etablissement.id, directionEmail }, 200);
});
