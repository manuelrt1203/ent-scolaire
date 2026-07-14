import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

async function must(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.error(`FAIL: ${label} ->`, error.message);
    process.exit(1);
  }
  console.log(`OK: ${label}`);
  return data;
}

async function expectError(label, promise) {
  const { error } = await promise;
  if (!error) {
    console.error(`FAIL (should have been rejected by RLS): ${label}`);
    process.exit(1);
  }
  console.log(`OK (correctly rejected): ${label} -> ${error.message}`);
}

// Un UPDATE/SELECT bloqué par RLS ne renvoie pas d'erreur PostgREST : il
// affecte silencieusement 0 ligne. Il faut donc vérifier le nombre de lignes
// retournées, pas la présence d'une erreur.
async function expectNoRowsAffected(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.error(`FAIL (erreur inattendue): ${label} ->`, error.message);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.error(`FAIL (RLS n'a pas bloqué l'opération): ${label}`);
    process.exit(1);
  }
  console.log(`OK (correctement bloqué par RLS, 0 ligne affectée): ${label}`);
}

const prof = client();
await must("connexion prof", prof.auth.signInWithPassword({ email: "prof@ecole-test.fr", password: PASS }));

const mc = await must(
  "lecture matiere_classe (Maths, Terminale A)",
  prof.from("matiere_classe").select("id, matieres(nom), classes(nom)").limit(1).single(),
);
const periode = await must("lecture periode T1", prof.from("periodes").select("id").eq("nom", "Trimestre 1").single());

const releve = await must(
  "creation releve (brouillon)",
  prof.from("releves_notes").insert({ matiere_classe_id: mc.id, periode_id: periode.id }).select().single(),
);
if (releve.statut !== "brouillon") { console.error("FAIL: statut initial devrait etre brouillon"); process.exit(1); }
console.log("OK: statut initial = brouillon");

const inscriptions = await must("lecture inscriptions classe", prof.from("inscriptions").select("eleve_id").eq("classe_id", (await prof.from("matiere_classe").select("classe_id").eq("id", mc.id).single()).data.classe_id));

const notesRows = await must(
  "creation notes (une par eleve)",
  prof.from("notes").insert(inscriptions.map((i) => ({ releve_id: releve.id, eleve_id: i.eleve_id }))).select(),
);

for (const n of notesRows) {
  await must(`saisie note eleve ${n.eleve_id}`, prof.from("notes").update({ valeur: 14.5 }).eq("id", n.id));
}

await expectError(
  "un prof ne doit pas pouvoir valider directement (RPC reservee direction)",
  prof.rpc("valider_releve", { p_releve_id: releve.id }),
);

await must("soumission du releve (RPC soumettre_releve)", prof.rpc("soumettre_releve", { p_releve_id: releve.id }));

const { data: releveApresSoumission } = await prof.from("releves_notes").select("statut").eq("id", releve.id).single();
console.log(`OK: statut apres soumission = ${releveApresSoumission.statut}`);

await expectNoRowsAffected(
  "le prof ne doit plus pouvoir modifier une note apres soumission (RLS)",
  prof.from("notes").update({ valeur: 20 }).eq("id", notesRows[0].id).select(),
);

const direction = client();
await must("connexion direction", direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }));

await must("validation du releve (RPC valider_releve)", direction.rpc("valider_releve", { p_releve_id: releve.id, p_commentaire: "RAS" }));

const eleve1 = await must("lecture eleve1 (pour moyenne)", direction.from("profiles").select("id").eq("email", "eleve1@ecole-test.fr").single());

const moyenne = await must(
  "calcul moyenne_matiere apres validation",
  direction.rpc("calculer_moyenne_matiere", { p_eleve_id: eleve1.id, p_matiere_classe_id: mc.id, p_periode_id: periode.id }),
);
console.log(`OK: moyenne calculee = ${moyenne} (attendu 14.5)`);
if (moyenne !== 14.5) { console.error("FAIL: moyenne incorrecte"); process.exit(1); }

const eleveClient = client();
await must("connexion eleve1", eleveClient.auth.signInWithPassword({ email: "eleve1@ecole-test.fr", password: PASS }));

const { data: notesAvantPublication } = await eleveClient.from("notes").select("*").eq("eleve_id", eleve1.id);
console.log(`OK: eleve ne voit AUCUNE note avant publication (${notesAvantPublication.length} lignes visibles, attendu 0)`);
if (notesAvantPublication.length !== 0) { console.error("FAIL: RLS ne bloque pas la lecture avant publication"); process.exit(1); }

await must("publication du releve (RPC publier_releve)", direction.rpc("publier_releve", { p_releve_id: releve.id }));

const { data: notesApresPublication } = await eleveClient.from("notes").select("valeur").eq("eleve_id", eleve1.id);
console.log(`OK: eleve voit ${notesApresPublication.length} note(s) apres publication, valeur=${notesApresPublication[0]?.valeur}`);
if (notesApresPublication.length !== 1 || Number(notesApresPublication[0].valeur) !== 14.5) {
  console.error("FAIL: publication non visible ou valeur incorrecte");
  process.exit(1);
}

const eleve2 = await must("lecture eleve2 (test RLS negatif parent)", direction.from("profiles").select("id").eq("email", "eleve2@ecole-test.fr").single());
const parentClient = client();
await must("connexion parent (lie a eleve1 uniquement)", parentClient.auth.signInWithPassword({ email: "parent@ecole-test.fr", password: PASS }));

const { data: notesAutreEnfant } = await parentClient.from("notes").select("*").eq("eleve_id", eleve2.id);
console.log(`OK: parent voit ${notesAutreEnfant.length} note(s) de l'eleve d'une autre famille (attendu 0)`);
if (notesAutreEnfant.length !== 0) { console.error("FAIL: RLS ne protege pas les notes d'un autre enfant"); process.exit(1); }

const moyenneGenerale = await must(
  "calcul moyenne_generale eleve1",
  direction.rpc("calculer_moyenne_generale", { p_eleve_id: eleve1.id, p_periode_id: periode.id }),
);
console.log(`OK: moyenne generale eleve1 = ${moyenneGenerale}`);

const bulletinEleve = await must("lecture v_bulletin par l'eleve", eleveClient.from("v_bulletin").select("*").eq("eleve_id", eleve1.id));
console.log(`OK: v_bulletin eleve1 = ${bulletinEleve.length} ligne(s), moyenne=${bulletinEleve[0]?.moyenne}`);
if (bulletinEleve.length !== 1 || Number(bulletinEleve[0].moyenne) !== 14.5) {
  console.error("FAIL: v_bulletin incorrect pour l'eleve");
  process.exit(1);
}

const bulletinParent = await must("lecture v_bulletin par le parent", parentClient.from("v_bulletin").select("*").eq("eleve_id", eleve1.id));
console.log(`OK: v_bulletin (vue parent) = ${bulletinParent.length} ligne(s)`);
if (bulletinParent.length !== 1) {
  console.error("FAIL: v_bulletin incorrect pour le parent");
  process.exit(1);
}

console.log("\n=== TOUT LE CYCLE DE VIE A ETE VERIFIE AVEC SUCCES ===");
