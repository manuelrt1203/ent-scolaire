import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

async function must(label, promiseFactory) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await promiseFactory();
    if (!error) {
      console.log(`OK: ${label}`);
      return data;
    }
    if (attempt === maxAttempts) {
      console.error(`FAIL: ${label} ->`, error.message ?? JSON.stringify(error));
      process.exit(1);
    }
    console.log(`RETRY: ${label} -> ${error.message}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const prof = client();
await must("connexion prof", () => prof.auth.signInWithPassword({ email: "prof@ecole-test.fr", password: PASS }));

const eleve1 = client();
await must("connexion eleve1", () => eleve1.auth.signInWithPassword({ email: "eleve1@ecole-test.fr", password: PASS }));

const directionAutreEcole = client();
await must("connexion direction (autre établissement)", () =>
  directionAutreEcole.auth.signInWithPassword({ email: "manuelrt1203@gmail.com", password: "Test1234!" }),
);

const mc = await must(
  "lecture matiere_classe du prof (Maths/Terminale A)",
  () => prof.from("matiere_classe").select("id").limit(1).single(),
);
const { data: profUser } = await prof.auth.getUser();

const bucket = "ressources-pedagogiques";
const nomFichier = `${crypto.randomUUID()}-test.txt`;
const chemin = `${mc.id}/${nomFichier}`;
const contenu = new Blob(["contenu de test ressource pédagogique"], { type: "text/plain" });

console.log("\n=== UPLOAD (professeur) ===");

await must("upload du fichier de test", () => prof.storage.from(bucket).upload(chemin, contenu, { contentType: "text/plain" }));

const ressource = await must(
  "insertion de la ligne de métadonnées",
  () => prof.from("ressources_pedagogiques").insert({
    matiere_classe_id: mc.id,
    professeur_id: profUser.user.id,
    titre: "Fichier de test",
    chemin_fichier: chemin,
    type_mime: "text/plain",
    taille_octets: contenu.size,
  }).select().single(),
);

console.log("\n=== LECTURE (élève de la bonne classe) ===");

const ressourcesEleve = await must(
  "eleve1 liste les ressources de sa classe (via matiere_classe_id)",
  () => eleve1.from("ressources_pedagogiques").select("*").eq("matiere_classe_id", mc.id),
);
if (ressourcesEleve.length !== 1) {
  console.error("FAIL: eleve1 devrait voir exactement 1 ressource");
  process.exit(1);
}
console.log("OK: eleve1 voit la ressource dans la table de métadonnées");

const signedUrlData = await must(
  "eleve1 génère une URL signée",
  () => eleve1.storage.from(bucket).createSignedUrl(chemin, 60),
);

const reponseFichier = await fetch(signedUrlData.signedUrl);
const texteRecu = await reponseFichier.text();
if (!reponseFichier.ok || !texteRecu.includes("contenu de test ressource pédagogique")) {
  console.error("FAIL: le contenu récupéré via l'URL signée ne correspond pas");
  process.exit(1);
}
console.log("OK: contenu du fichier récupéré via l'URL signée correspond");

console.log("\n=== RLS NÉGATIF (direction d'un autre établissement) ===");

const { data: listeAutreEcole } = await directionAutreEcole.from("ressources_pedagogiques").select("*").eq("matiere_classe_id", mc.id);
if (listeAutreEcole && listeAutreEcole.length > 0) {
  console.error("FAIL: la direction d'un autre établissement ne devrait pas voir cette ressource (métadonnées)");
  process.exit(1);
}
console.log("OK: métadonnées invisibles pour la direction d'un autre établissement");

const { error: erreurSignedUrlAutreEcole } = await directionAutreEcole.storage.from(bucket).createSignedUrl(chemin, 60);
if (!erreurSignedUrlAutreEcole) {
  console.error("FAIL: la direction d'un autre établissement ne devrait pas pouvoir générer d'URL signée pour ce fichier");
  process.exit(1);
}
console.log(`OK (correctement rejeté): URL signée refusée pour la direction d'un autre établissement -> ${erreurSignedUrlAutreEcole.message}`);

console.log("\n=== SUPPRESSION (professeur) ===");

await must("suppression de l'objet storage", () => prof.storage.from(bucket).remove([chemin]));
await must("suppression de la ligne de métadonnées", () => prof.from("ressources_pedagogiques").delete().eq("id", ressource.id).select());

console.log("\n=== RESSOURCES PÉDAGOGIQUES VÉRIFIÉES AVEC SUCCÈS ===");
