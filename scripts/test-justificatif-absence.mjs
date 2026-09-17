// Vérifie le bucket vie-scolaire-justificatifs et la RPC
// ajouter_justificatif_absence (migration 0012) contre le vrai projet
// Supabase : l'élève concerné (ou son parent) peut joindre un justificatif,
// un autre élève ne peut ni écrire la colonne ni lire le fichier.
import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

// Même helper que scripts/test-ressources.mjs (retry sur erreur transitoire,
// tier gratuit Supabase sous charge — voir scripts/test-notifications.mjs
// pour le détail de cette flakiness déjà documentée dans ce projet).
async function must(label, promiseFactory) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await promiseFactory();
    if (!error) {
      console.log(`OK: ${label}`);
      return data;
    }
    if (attempt === maxAttempts) throw new Error(`${label} -> ${error.message ?? JSON.stringify(error)}`);
    console.log(`RETRY: ${label} -> ${error.message}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const BUCKET = "vie-scolaire-justificatifs";

const direction = client();
await must("connexion direction", () => direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }));

const prof = client();
await must("connexion prof", () => prof.auth.signInWithPassword({ email: "prof@ecole-test.fr", password: PASS }));
const { data: profUser } = await prof.auth.getUser();

const eleve1 = client();
await must("connexion eleve1", () => eleve1.auth.signInWithPassword({ email: "eleve1@ecole-test.fr", password: PASS }));
const { data: eleve1User } = await eleve1.auth.getUser();

const eleve2 = client();
await must("connexion eleve2", () => eleve2.auth.signInWithPassword({ email: "eleve2@ecole-test.fr", password: PASS }));

const inscription = await must("classe d'eleve1", () =>
  prof.from("inscriptions").select("classe_id").eq("eleve_id", eleve1User.user.id).limit(1).single(),
);

const evenement = await must("prof signale une absence de test", () =>
  prof
    .from("vie_scolaire_evenements")
    .insert({
      classe_id: inscription.classe_id,
      eleve_id: eleve1User.user.id,
      type: "absence",
      date: new Date().toISOString().slice(0, 10),
      signale_par: profUser.user.id,
    })
    .select()
    .single(),
);

try {
  const chemin = `${evenement.id}/${crypto.randomUUID()}-justificatif.txt`;
  const contenu = new Blob(["certificat médical de test"], { type: "text/plain" });

  console.log("\n=== ELEVE1 (concerné) : upload + RPC ===");
  await must("eleve1 upload le fichier", () => eleve1.storage.from(BUCKET).upload(chemin, contenu, { contentType: "text/plain" }));
  await must("eleve1 appelle ajouter_justificatif_absence", () =>
    eleve1.rpc("ajouter_justificatif_absence", { p_vie_scolaire_id: evenement.id, p_chemin: chemin }),
  );
  const ligne = await must("vérifie que justificatif_chemin est enregistré", () =>
    eleve1.from("vie_scolaire_evenements").select("justificatif_chemin").eq("id", evenement.id).single(),
  );
  if (ligne.justificatif_chemin !== chemin) throw new Error("justificatif_chemin ne correspond pas au chemin uploadé");
  console.log("OK: colonne justificatif_chemin correcte");

  console.log("\n=== PROF (accès légitime) : lecture ===");
  const urlProf = await must("prof génère une URL signée", () => prof.storage.from(BUCKET).createSignedUrl(chemin, 60));
  const reponseProf = await fetch(urlProf.signedUrl);
  const texteProf = await reponseProf.text();
  if (!reponseProf.ok || !texteProf.includes("certificat médical de test")) throw new Error("le prof devrait pouvoir lire le justificatif");
  console.log("OK: prof lit le contenu réel du fichier");

  console.log("\n=== ELEVE2 (non concerné) : doit être rejeté ===");
  const { error: erreurRpcEleve2 } = await eleve2.rpc("ajouter_justificatif_absence", { p_vie_scolaire_id: evenement.id, p_chemin: "hacked.txt" });
  if (!erreurRpcEleve2) throw new Error("eleve2 ne devrait pas pouvoir modifier le justificatif d'eleve1");
  console.log(`OK (correctement rejeté): ${erreurRpcEleve2.message}`);

  const { error: erreurUrlEleve2 } = await eleve2.storage.from(BUCKET).createSignedUrl(chemin, 60);
  if (!erreurUrlEleve2) throw new Error("eleve2 ne devrait pas pouvoir générer d'URL signée pour ce fichier");
  console.log(`OK (correctement rejeté): URL signée refusée pour eleve2 -> ${erreurUrlEleve2.message}`);
} finally {
  // Pas de policy DELETE sur ce bucket (aucun besoin produit identifié pour
  // le moment) : le fichier de test reste dans le bucket privé, sans
  // conséquence (jamais listé nulle part, seulement atteignable via le
  // chemin exact déjà connu). Seule la ligne vie_scolaire_evenements est
  // nettoyée (direction : seule policy DELETE existante sur cette table).
  await direction.from("vie_scolaire_evenements").delete().eq("id", evenement.id);
  console.log("\nOK: nettoyage (ligne vie_scolaire_evenements supprimée, fichier de test laissé dans le bucket privé)");
}

console.log("\n=== JUSTIFICATIF D'ABSENCE VÉRIFIÉ AVEC SUCCÈS ===");
