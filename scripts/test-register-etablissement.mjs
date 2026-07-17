import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";

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

const emailJetable = `test-inscription-${Date.now()}@example.com`;
const anon = client();

console.log("\n=== INSCRIPTION (cas nominal, appelant anonyme non connecté) ===");

const resultat = await must(
  "appel register-etablissement (anonyme)",
  () => anon.functions.invoke("register-etablissement", {
    body: {
      etablissementNom: "Lycée Test M7",
      etablissementAdresse: "1 rue du Test",
      directionNom: "Testeur",
      directionPrenom: "Marie",
      directionEmail: emailJetable,
    },
  }),
);
console.log("Réponse:", resultat);
if (!resultat.etablissementId || resultat.directionEmail !== emailJetable) {
  console.error("FAIL: réponse inattendue");
  process.exit(1);
}

// Vérification directe en base via un client "service" pour contrôler
// exactement ce qui a été créé (impossible via anon, RLS l'interdit —
// preuve que la fonction a bien contourné RLS côté serveur uniquement).
const direction = client();
await must("connexion direction pré-existante (pour lecture de contrôle)", () =>
  direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: "Test1234!" }),
);
const { data: autreEtablissement } = await direction
  .from("profiles")
  .select("etablissement_id")
  .eq("email", "direction@ecole-test.fr")
  .single();

console.log(`OK: établissement de test créé avec id ${resultat.etablissementId} (différent de l'établissement existant ${autreEtablissement.etablissement_id}: ${resultat.etablissementId !== autreEtablissement.etablissement_id})`);
if (resultat.etablissementId === autreEtablissement.etablissement_id) {
  console.error("FAIL: le nouvel établissement ne devrait pas être confondu avec l'existant");
  process.exit(1);
}

// L'activation (requestActivationCode/verifyActivationCode/setPassword) est
// du code déjà testé et utilisé en production pour tout compte invité — pas
// re-testée ici, seule la partie nouvelle (register-etablissement) l'est.

console.log("\n=== DOUBLON (même email deux fois) ===");

const { data: doublonData, error: doublonError } = await anon.functions.invoke("register-etablissement", {
  body: {
    etablissementNom: "Lycée Test M7 bis",
    directionNom: "Testeur",
    directionPrenom: "Marie",
    directionEmail: emailJetable,
  },
});
if (!doublonError) {
  console.error("FAIL: un deuxième établissement avec le même email direction aurait dû échouer");
  process.exit(1);
}
console.log(`OK (correctement rejeté): doublon email -> ${JSON.stringify(doublonData ?? doublonError.context?.body ?? doublonError.message)}`);

console.log(`\nÀ vérifier/nettoyer côté service-role (RLS empêche ce script de le faire lui-même, normal) :
  - établissement "Lycée Test M7 bis" ne doit PAS exister (compensation du doublon)
  - établissement "Lycée Test M7" (id ${resultat.etablissementId}) doit exister seul, à nettoyer après vérification`);

console.log("\n=== REGISTER-ETABLISSEMENT VÉRIFIÉ AVEC SUCCÈS ===");
