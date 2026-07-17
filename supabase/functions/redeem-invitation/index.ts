// Crée un compte à partir d'un code d'invitation (voir table `invitations`
// et RPC `invitation_par_code`) : le rôle et le rattachement (classe pour
// un élève, élève pour un parent) viennent du code, jamais du visiteur —
// c'est ce qui empêche toute usurpation de rôle. Même pattern que
// register-etablissement/admin-create-user (clé service-role, compensation
// en cascade si une étape échoue), appelable par un visiteur anonyme.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const body = await req.json();
  const { code, nom, prenom, email } = body as {
    code?: string;
    nom?: string;
    prenom?: string;
    email?: string;
  };

  if (!code || !nom || !prenom || !email) {
    return json({ error: "code, nom, prenom et email sont requis" }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Adresse email invalide" }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invitation, error: invitationError } = await adminClient
    .from("invitations")
    .select("id, etablissement_id, role, classe_id, eleve_id")
    .eq("code", code)
    .eq("actif", true)
    .maybeSingle();
  if (invitationError) {
    return json({ error: invitationError.message }, 400);
  }
  if (!invitation) {
    return json({ error: "Code d'invitation invalide ou désactivé" }, 400);
  }

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
    etablissement_id: invitation.etablissement_id,
    role: invitation.role,
    nom,
    prenom,
    email,
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: profileError.message }, 400);
  }

  if (invitation.role === "eleve" && invitation.classe_id) {
    const { data: annee, error: anneeError } = await adminClient
      .from("annees_scolaires")
      .select("id")
      .eq("etablissement_id", invitation.etablissement_id)
      .eq("est_active", true)
      .maybeSingle();
    if (anneeError || !annee) {
      await adminClient.from("profiles").delete().eq("id", created.user.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: anneeError?.message ?? "Aucune année scolaire active pour cet établissement" }, 400);
    }
    const { error: inscriptionError } = await adminClient.from("inscriptions").insert({
      eleve_id: created.user.id,
      classe_id: invitation.classe_id,
      annee_scolaire_id: annee.id,
    });
    if (inscriptionError) {
      await adminClient.from("profiles").delete().eq("id", created.user.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: inscriptionError.message }, 400);
    }
  }

  if (invitation.role === "parent" && invitation.eleve_id) {
    const { error: lienError } = await adminClient.from("liens_parents_eleves").insert({
      parent_id: created.user.id,
      eleve_id: invitation.eleve_id,
    });
    if (lienError) {
      await adminClient.from("profiles").delete().eq("id", created.user.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: lienError.message }, 400);
    }
  }

  return json({ email }, 200);
});
