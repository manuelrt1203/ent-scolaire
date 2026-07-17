import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

async function must(label, promiseFactory) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await promiseFactory();
    if (!error) {
      console.log(`OK: ${label}`);
      return data;
    }
    if (attempt === 3) {
      console.error(`FAIL: ${label} ->`, error.message ?? JSON.stringify(error));
      process.exit(1);
    }
    console.log(`RETRY: ${label} -> ${error.message}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

const direction = client();
await must("connexion direction@ecole-test.fr", () =>
  direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }),
);

const directionProfil = await must(
  "lecture profil direction",
  () => direction.from("profiles").select("id, etablissement_id").eq("email", "direction@ecole-test.fr").single(),
);

const mc = await must(
  "lecture matiere_classe (pour classe_id de test)",
  () => direction.from("matiere_classe").select("classe_id").limit(1).single(),
);

const eleve1 = await must(
  "lecture profil eleve1 (pour code parent)",
  () => direction.from("profiles").select("id").eq("email", "eleve1@ecole-test.fr").single(),
);

function genCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

console.log("\n=== CRÉATION DES CODES D'INVITATION (direction) ===");

const codeProf = genCode();
const invProf = await must(
  "création code professeur",
  () => direction.from("invitations").insert({
    etablissement_id: directionProfil.etablissement_id,
    role: "professeur",
    code: codeProf,
    created_by: directionProfil.id,
  }).select().single(),
);

const codeEleveAvecClasse = genCode();
const invEleveClasse = await must(
  "création code élève (avec classe_id, auto-inscription attendue)",
  () => direction.from("invitations").insert({
    etablissement_id: directionProfil.etablissement_id,
    role: "eleve",
    classe_id: mc.classe_id,
    code: codeEleveAvecClasse,
    created_by: directionProfil.id,
  }).select().single(),
);

const codeEleveSansClasse = genCode();
const invEleveSansClasse = await must(
  "création code élève (sans classe_id)",
  () => direction.from("invitations").insert({
    etablissement_id: directionProfil.etablissement_id,
    role: "eleve",
    code: codeEleveSansClasse,
    created_by: directionProfil.id,
  }).select().single(),
);

const codeParent = genCode();
const invParent = await must(
  "création code parent (lié à eleve1, lien parent-enfant attendu)",
  () => direction.from("invitations").insert({
    etablissement_id: directionProfil.etablissement_id,
    role: "parent",
    eleve_id: eleve1.id,
    code: codeParent,
    created_by: directionProfil.id,
  }).select().single(),
);

console.log("\n=== RÉDEMPTION (visiteur anonyme) ===");

const anon = client();
const ts = Date.now();

const resultProf = await must(
  "redeem code professeur",
  () => anon.functions.invoke("redeem-invitation", {
    body: { code: codeProf, nom: "TestProf", prenom: "Invitation", email: `test-inv-prof-${ts}@example.com` },
  }),
);
console.log("réponse:", resultProf);

const resultEleveClasse = await must(
  "redeem code élève avec classe",
  () => anon.functions.invoke("redeem-invitation", {
    body: { code: codeEleveAvecClasse, nom: "TestEleveClasse", prenom: "Invitation", email: `test-inv-eleve-classe-${ts}@example.com` },
  }),
);
console.log("réponse:", resultEleveClasse);

const resultEleveSansClasse = await must(
  "redeem code élève sans classe",
  () => anon.functions.invoke("redeem-invitation", {
    body: { code: codeEleveSansClasse, nom: "TestEleveSansClasse", prenom: "Invitation", email: `test-inv-eleve-sansclasse-${ts}@example.com` },
  }),
);
console.log("réponse:", resultEleveSansClasse);

const resultParent = await must(
  "redeem code parent",
  () => anon.functions.invoke("redeem-invitation", {
    body: { code: codeParent, nom: "TestParent", prenom: "Invitation", email: `test-inv-parent-${ts}@example.com` },
  }),
);
console.log("réponse:", resultParent);

const { error: badCodeError } = await anon.functions.invoke("redeem-invitation", {
  body: { code: "CODE-INEXISTANT", nom: "X", prenom: "Y", email: `test-inv-bad-${ts}@example.com` },
});
if (!badCodeError) {
  console.error("FAIL: un code inexistant aurait dû être rejeté");
  process.exit(1);
}
console.log(`OK (correctement rejeté): code inexistant -> ${JSON.stringify(badCodeError.context?.body ?? badCodeError.message)}`);

console.log("\n=== VÉRIFICATION DES EFFETS (via direction, RLS) ===");

const { data: profilProf } = await direction.from("profiles").select("id, role, etablissement_id").eq("email", `test-inv-prof-${ts}@example.com`).single();
if (profilProf.role !== "professeur" || profilProf.etablissement_id !== directionProfil.etablissement_id) {
  console.error("FAIL: profil professeur créé avec un rôle/établissement incorrect");
  process.exit(1);
}
console.log("OK: profil professeur créé avec le bon rôle et le bon établissement");

const { data: profilEleveClasse } = await direction.from("profiles").select("id").eq("email", `test-inv-eleve-classe-${ts}@example.com`).single();
const { data: inscriptionAuto } = await direction.from("inscriptions").select("classe_id").eq("eleve_id", profilEleveClasse.id).maybeSingle();
if (!inscriptionAuto || inscriptionAuto.classe_id !== mc.classe_id) {
  console.error("FAIL: l'élève avec code scopé à une classe n'a pas été auto-inscrit");
  process.exit(1);
}
console.log("OK: élève auto-inscrit dans la bonne classe");

const { data: profilEleveSansClasse } = await direction.from("profiles").select("id").eq("email", `test-inv-eleve-sansclasse-${ts}@example.com`).single();
const { data: inscriptionAbsente } = await direction.from("inscriptions").select("id").eq("eleve_id", profilEleveSansClasse.id).maybeSingle();
if (inscriptionAbsente) {
  console.error("FAIL: l'élève sans classe_id sur son code n'aurait pas dû être auto-inscrit");
  process.exit(1);
}
console.log("OK: élève sans classe_id sur le code -> pas d'auto-inscription (attendu)");

const { data: profilParent } = await direction.from("profiles").select("id").eq("email", `test-inv-parent-${ts}@example.com`).single();
const { data: lienAuto } = await direction.from("liens_parents_eleves").select("eleve_id").eq("parent_id", profilParent.id).maybeSingle();
if (!lienAuto || lienAuto.eleve_id !== eleve1.id) {
  console.error("FAIL: le parent n'a pas été automatiquement lié au bon élève");
  process.exit(1);
}
console.log("OK: parent automatiquement lié à eleve1");

console.log("\n=== NETTOYAGE ===");
console.log(`Comptes de test à nettoyer côté service-role (emails se terminant par -${ts}@example.com), invitations : ${invProf.id}, ${invEleveClasse.id}, ${invEleveSansClasse.id}, ${invParent.id}`);

console.log("\n=== CODES D'INVITATION VÉRIFIÉS AVEC SUCCÈS ===");
