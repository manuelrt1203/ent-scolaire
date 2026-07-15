// Provisionne un compte (direction/professeur/eleve/parent). Utilise la clé
// service-role (secret côté edge function, jamais exposée aux clients) mais
// vérifie d'abord, via le JWT de l'appelant, que celui-ci est bien "direction"
// avant de créer quoi que ce soit — c'est la vraie frontière d'autorisation
// pour la création de comptes (pas d'auto-inscription possible côté client).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }

  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role, etablissement_id")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || callerProfile.role !== "direction") {
    return new Response(JSON.stringify({ error: "Seule la direction peut créer un compte" }), { status: 403 });
  }

  const body = await req.json();
  const { email, role, nom, prenom } = body as {
    email?: string;
    role?: string;
    nom?: string;
    prenom?: string;
  };

  if (!email || !role || !nom || !prenom) {
    return new Response(JSON.stringify({ error: "email, role, nom et prenom sont requis" }), { status: 400 });
  }
  if (!["direction", "professeur", "eleve", "parent"].includes(role)) {
    return new Response(JSON.stringify({ error: "Rôle invalide" }), { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const tempPassword = crypto.randomUUID();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return new Response(JSON.stringify({ error: createError?.message ?? "Échec de création du compte" }), {
      status: 400,
    });
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: created.user.id,
    etablissement_id: callerProfile.etablissement_id,
    role,
    nom,
    prenom,
    email,
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
  }

  // Pas de lien à transmettre : la personne active elle-même son compte via
  // "Première connexion" (code à 6 chiffres envoyé par email, voir
  // requestActivationCode/verifyActivationCode dans packages/shared).
  return new Response(JSON.stringify({ userId: created.user.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
