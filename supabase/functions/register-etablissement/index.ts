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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
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
    return new Response(
      JSON.stringify({ error: "etablissementNom, directionNom, directionPrenom et directionEmail sont requis" }),
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(directionEmail)) {
    return new Response(JSON.stringify({ error: "Adresse email invalide" }), { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: etablissement, error: etablissementError } = await adminClient
    .from("etablissements")
    .insert({ nom: etablissementNom, adresse: etablissementAdresse || null })
    .select()
    .single();
  if (etablissementError) {
    return new Response(JSON.stringify({ error: etablissementError.message }), { status: 400 });
  }

  const { libelle, date_debut, date_fin } = anneeScolaireActive();
  const { data: anneeScolaire, error: anneeError } = await adminClient
    .from("annees_scolaires")
    .insert({ etablissement_id: etablissement.id, libelle, date_debut, date_fin, est_active: true })
    .select()
    .single();
  if (anneeError) {
    await adminClient.from("etablissements").delete().eq("id", etablissement.id);
    return new Response(JSON.stringify({ error: anneeError.message }), { status: 400 });
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
    return new Response(JSON.stringify({ error: createError?.message ?? "Échec de création du compte" }), {
      status: 400,
    });
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
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ etablissementId: etablissement.id, directionEmail }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
