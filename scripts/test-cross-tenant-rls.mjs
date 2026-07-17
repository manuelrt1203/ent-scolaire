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

async function expectNoRowsAffected(label, promiseFactory) {
  const { data, error } = await promiseFactory();
  if (error) {
    console.error(`FAIL (erreur inattendue): ${label} ->`, error.message);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.error(`FAIL (RLS n'a pas bloqué l'opération cross-tenant): ${label}`);
    process.exit(1);
  }
  console.log(`OK (correctement bloqué par RLS, 0 ligne): ${label}`);
}

const MC_ID = "00000000-0000-0000-0000-000000000002"; // appartient à l'établissement "École Test SMTP"
const AUTRE_ETABLISSEMENT_CLASSE_ID = "1fc4da6b-27a5-48b3-be54-4dcd1b3924ae";

const direction = client();
await must("connexion direction@ecole-test.fr (établissement A)", () =>
  direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }),
);

console.log("\n=== CROSS-TENANT : direction A ne doit PAS pouvoir écrire dans l'établissement B ===");

await expectNoRowsAffected(
  "update matiere_classe (coefficient) d'un autre établissement",
  () => direction.from("matiere_classe").update({ coefficient: 3 }).eq("id", MC_ID).select(),
);

await expectNoRowsAffected(
  "delete matiere_classe d'un autre établissement",
  () => direction.from("matiere_classe").delete().eq("id", MC_ID).select(),
);

const { error: insertAffectationErr } = await direction
  .from("affectations")
  .insert({ professeur_id: direction.auth.getUser ? (await direction.auth.getUser()).data.user.id : null, matiere_classe_id: MC_ID });
if (!insertAffectationErr) {
  console.error("FAIL: insertion d'affectation sur un matiere_classe d'un autre établissement aurait dû être bloquée");
  process.exit(1);
}
console.log(`OK (correctement rejeté): insert affectation cross-tenant -> ${insertAffectationErr.message}`);

const { error: insertInscriptionErr } = await direction
  .from("inscriptions")
  .insert({ eleve_id: (await direction.auth.getUser()).data.user.id, classe_id: AUTRE_ETABLISSEMENT_CLASSE_ID, annee_scolaire_id: "b493701c-131a-45fe-8b04-c50c500a0b68" });
if (!insertInscriptionErr) {
  console.error("FAIL: insertion d'inscription dans une classe d'un autre établissement aurait dû être bloquée");
  process.exit(1);
}
console.log(`OK (correctement rejeté): insert inscription cross-tenant -> ${insertInscriptionErr.message}`);

console.log("\n=== NON-RÉGRESSION : direction A doit toujours pouvoir écrire dans SON établissement ===");

const mcPropre = await must(
  "lecture d'un matiere_classe de l'établissement A",
  () => direction.from("matiere_classe").select("id, coefficient").limit(1).single(),
);
const nouveauCoeff = Number(mcPropre.coefficient) === 2 ? 1 : 2;
await must(
  "update matiere_classe (coefficient) dans son propre établissement",
  () => direction.from("matiere_classe").update({ coefficient: nouveauCoeff }).eq("id", mcPropre.id).select(),
);
await must(
  "restauration du coefficient d'origine",
  () => direction.from("matiere_classe").update({ coefficient: mcPropre.coefficient }).eq("id", mcPropre.id).select(),
);

console.log("\n=== NETTOYAGE FIXTURE ===");
console.log(`Fixture cross-tenant à nettoyer côté service-role : matiere_classe ${MC_ID}, matiere 00000000-0000-0000-0000-000000000001`);

console.log("\n=== CORRECTIF RLS MULTI-TENANT VÉRIFIÉ AVEC SUCCÈS ===");
