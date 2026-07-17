// Provisionne un compte (direction/professeur/eleve/parent). Utilise la clé
// service-role (secret côté edge function, jamais exposée aux clients) mais
// vérifie d'abord, via le JWT de l'appelant, que celui-ci est bien "direction"
// avant de créer quoi que ce soit — c'est la vraie frontière d'autorisation
// pour la création de comptes (pas d'auto-inscription possible côté client).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Appelée depuis un navigateur/Electron : sans ces headers, le preflight
// OPTIONS échoue et le client voit "Failed to send a request to the Edge
// Function" sans jamais atteindre le code ci-dessous (voir même correctif
// sur register-etablissement, découvert via un test réel dans l'app).
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Non authentifié" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) {
    return json({ error: "Non authentifié" }, 401);
  }

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role, etablissement_id")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || callerProfile.role !== "direction") {
    return json({ error: "Seule la direction peut créer un compte" }, 403);
  }

  const body = await req.json();
  const { email, role, nom, prenom } = body as {
    email?: string;
    role?: string;
    nom?: string;
    prenom?: string;
  };

  if (!email || !role || !nom || !prenom) {
    return json({ error: "email, role, nom et prenom sont requis" }, 400);
  }
  if (!["direction", "professeur", "eleve", "parent"].includes(role)) {
    return json({ error: "Rôle invalide" }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const tempPassword = crypto.randomUUID();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Échec de création du compte" }, 400);
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
    return json({ error: profileError.message }, 400);
  }

  // Pas de lien à transmettre : la personne active elle-même son compte via
  // "Première connexion" (code à 6 chiffres envoyé par email, voir
  // requestActivationCode/verifyActivationCode dans packages/shared).
  return json({ userId: created.user.id }, 200);
});
