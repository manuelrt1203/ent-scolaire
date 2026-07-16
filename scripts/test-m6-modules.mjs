import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Le projet est en tier gratuit : des échecs transitoires (pool de connexions,
// propagation du JWT sous rafale de requêtes) surviennent parfois. Un retry
// unique après une pause distingue ça d'un vrai bug RLS déterministe.
async function must(label, promiseFactory) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await promiseFactory();
    if (!error) {
      console.log(`OK: ${label}`);
      return data;
    }
    if (attempt === 3) {
      console.error(`FAIL: ${label} ->`, error.message);
      process.exit(1);
    }
    console.log(`RETRY (échec transitoire ?): ${label} -> ${error.message}`);
    await sleep(1500);
  }
}

async function expectError(label, promiseFactory) {
  const { error } = await promiseFactory();
  if (!error) {
    console.error(`FAIL (should have been rejected): ${label}`);
    process.exit(1);
  }
  console.log(`OK (correctement rejeté): ${label} -> ${error.message}`);
}

async function expectNoRowsAffected(label, promiseFactory) {
  const { data, error } = await promiseFactory();
  if (error) {
    console.error(`FAIL (erreur inattendue): ${label} ->`, error.message);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.error(`FAIL (RLS n'a pas bloqué l'opération): ${label}`);
    process.exit(1);
  }
  console.log(`OK (correctement bloqué par RLS, 0 ligne): ${label}`);
}

const direction = client();
await must("connexion direction", () => direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }));
await sleep(300);

const prof = client();
await must("connexion prof", () => prof.auth.signInWithPassword({ email: "prof@ecole-test.fr", password: PASS }));
await sleep(300);

const eleve1Client = client();
await must("connexion eleve1", () => eleve1Client.auth.signInWithPassword({ email: "eleve1@ecole-test.fr", password: PASS }));
await sleep(300);

const eleve2Client = client();
await must("connexion eleve2", () => eleve2Client.auth.signInWithPassword({ email: "eleve2@ecole-test.fr", password: PASS }));
await sleep(300);

const parentClient = client();
await must("connexion parent (lié à eleve1 uniquement)", () => parentClient.auth.signInWithPassword({ email: "parent@ecole-test.fr", password: PASS }));
await sleep(300);

const mc = await must(
  "lecture matiere_classe (via prof)",
  () => prof.from("matiere_classe").select("id, classe_id, matieres(nom), classes(nom)").limit(1).single(),
);
const eleve1 = await must("lecture profil eleve1", () => direction.from("profiles").select("id").eq("email", "eleve1@ecole-test.fr").single());
const eleve2 = await must("lecture profil eleve2", () => direction.from("profiles").select("id").eq("email", "eleve2@ecole-test.fr").single());
const profProfil = await must("lecture profil prof", () => direction.from("profiles").select("id").eq("email", "prof@ecole-test.fr").single());
const directionProfil = await must(
  "lecture profil direction",
  () => direction.from("profiles").select("id, etablissement_id").eq("email", "direction@ecole-test.fr").single(),
);

console.log("\n=== EMPLOI DU TEMPS (creneaux) ===");

const creneau = await must(
  "direction crée un créneau",
  () => direction.from("creneaux").insert({
    matiere_classe_id: mc.id,
    professeur_id: profProfil.id,
    jour_semaine: 1,
    heure_debut: "08:00",
    heure_fin: "09:00",
    salle: "B12",
  }).select().single(),
);

await expectError(
  "un prof ne doit pas pouvoir créer un créneau (réservé direction)",
  () => prof.from("creneaux").insert({
    matiere_classe_id: mc.id,
    professeur_id: profProfil.id,
    jour_semaine: 2,
    heure_debut: "10:00",
    heure_fin: "11:00",
  }),
);

const creneauxProf = await must("le prof voit ses propres créneaux", () => prof.from("creneaux").select("*").eq("id", creneau.id));
if (creneauxProf.length !== 1) { console.error("FAIL: le prof devrait voir son créneau"); process.exit(1); }

const creneauxEleve1 = await must("eleve1 voit le créneau de sa classe", () => eleve1Client.from("creneaux").select("*").eq("id", creneau.id));
if (creneauxEleve1.length !== 1) { console.error("FAIL: eleve1 devrait voir le créneau de sa classe"); process.exit(1); }

console.log("\n=== VIE SCOLAIRE (vie_scolaire_evenements) ===");

const absence = await must(
  "prof signale une absence pour eleve1",
  () => prof.from("vie_scolaire_evenements").insert({
    eleve_id: eleve1.id,
    classe_id: mc.classe_id,
    type: "absence",
    date: "2026-07-10",
    creneau_id: creneau.id,
    signale_par: profProfil.id,
  }).select().single(),
);

await expectError(
  "un prof ne doit pas pouvoir créer une sanction (réservé direction)",
  () => prof.from("vie_scolaire_evenements").insert({
    eleve_id: eleve1.id,
    classe_id: mc.classe_id,
    type: "sanction",
    date: "2026-07-10",
    signale_par: profProfil.id,
  }),
);

const sanction = await must(
  "direction crée une sanction",
  () => direction.from("vie_scolaire_evenements").insert({
    eleve_id: eleve1.id,
    classe_id: mc.classe_id,
    type: "sanction",
    date: "2026-07-10",
    description: "Avertissement",
    signale_par: directionProfil.id,
  }).select().single(),
);

await must("direction justifie l'absence", () => direction.from("vie_scolaire_evenements").update({ justifie: true, motif: "Certificat médical" }).eq("id", absence.id));

await expectNoRowsAffected(
  "le prof ne doit pas pouvoir modifier (justifier) une absence après création",
  () => prof.from("vie_scolaire_evenements").update({ justifie: true }).eq("id", absence.id).select(),
);

const vieScolaireEleve1 = await must("eleve1 voit ses propres événements de vie scolaire", () => eleve1Client.from("vie_scolaire_evenements").select("*").eq("eleve_id", eleve1.id));
if (vieScolaireEleve1.length < 2) { console.error("FAIL: eleve1 devrait voir son absence + sa sanction"); process.exit(1); }

const vieScolaireEleve2 = await must("eleve2 ne voit PAS les événements d'eleve1", () => eleve2Client.from("vie_scolaire_evenements").select("*").eq("eleve_id", eleve1.id));
if (vieScolaireEleve2.length !== 0) { console.error("FAIL: RLS ne protège pas la vie scolaire d'un autre élève"); process.exit(1); }

const vieScolaireParent = await must("le parent voit la vie scolaire d'eleve1", () => parentClient.from("vie_scolaire_evenements").select("*").eq("eleve_id", eleve1.id));
if (vieScolaireParent.length < 2) { console.error("FAIL: le parent devrait voir les événements de son enfant"); process.exit(1); }

const vieScolaireAutreEnfant = await must("le parent ne voit PAS la vie scolaire d'eleve2", () => parentClient.from("vie_scolaire_evenements").select("*").eq("eleve_id", eleve2.id));
if (vieScolaireAutreEnfant.length !== 0) { console.error("FAIL: RLS ne protège pas la vie scolaire d'un enfant qui n'est pas le sien"); process.exit(1); }

console.log("\n=== CAHIER DE TEXTES (cahier_texte) ===");

const entreeCahier = await must(
  "prof crée une entrée de cahier de textes",
  () => prof.from("cahier_texte").insert({
    matiere_classe_id: mc.id,
    professeur_id: profProfil.id,
    date_seance: "2026-07-10",
    contenu_seance: "Chapitre 3 : dérivées",
    travail_a_faire: "Exercices 12 à 15 p.42",
    date_echeance: "2026-07-15",
  }).select().single(),
);

const cahierEleve1 = await must("eleve1 voit l'entrée du cahier de textes", () => eleve1Client.from("cahier_texte").select("*").eq("id", entreeCahier.id));
if (cahierEleve1.length !== 1) { console.error("FAIL: eleve1 devrait voir l'entrée de sa classe"); process.exit(1); }

console.log("\n=== ACTUALITÉS (actualites) ===");

const actuTous = await must(
  "direction publie une actualité pour tous",
  () => direction.from("actualites").insert({
    etablissement_id: directionProfil.etablissement_id,
    auteur_id: directionProfil.id,
    titre: "Rentrée décalée",
    contenu: "La rentrée est décalée d'une heure.",
    cible: null,
  }).select().single(),
);

const actuEleves = await must(
  "direction publie une actualité ciblée élèves uniquement",
  () => direction.from("actualites").insert({
    etablissement_id: actuTous.etablissement_id,
    auteur_id: actuTous.auteur_id,
    titre: "Info élèves",
    contenu: "Réservé aux élèves.",
    cible: "eleve",
  }).select().single(),
);

await expectError("un élève ne doit pas pouvoir publier une actualité", () => eleve1Client.from("actualites").insert({ etablissement_id: actuTous.etablissement_id, titre: "x", contenu: "x" }));

const actuVuesParEleve = await must("eleve1 voit les actualités 'tous' + 'eleve'", () => eleve1Client.from("actualites").select("*").in("id", [actuTous.id, actuEleves.id]));
if (actuVuesParEleve.length !== 2) { console.error("FAIL: eleve1 devrait voir les 2 actualités"); process.exit(1); }

const actuVuesParParent = await must("le parent voit 'tous' mais PAS l'actualité ciblée élèves", () => parentClient.from("actualites").select("*").in("id", [actuTous.id, actuEleves.id]));
if (actuVuesParParent.length !== 1) { console.error("FAIL: le parent ne devrait voir que l'actualité 'tous'"); process.exit(1); }

console.log("\n=== CALENDRIER (evenements_calendrier) ===");

const evenement = await must(
  "direction crée un événement calendrier",
  () => direction.from("evenements_calendrier").insert({
    etablissement_id: actuTous.etablissement_id,
    auteur_id: actuTous.auteur_id,
    titre: "Conseil de classe",
    date_debut: "2026-07-20T17:00:00Z",
    date_fin: "2026-07-20T19:00:00Z",
    lieu: "Salle des professeurs",
    cible: null,
  }).select().single(),
);

const evenementVuParEleve = await must("eleve1 voit l'événement calendrier", () => eleve1Client.from("evenements_calendrier").select("*").eq("id", evenement.id));
if (evenementVuParEleve.length !== 1) { console.error("FAIL: eleve1 devrait voir l'événement 'tous'"); process.exit(1); }

console.log("\n=== ANNUAIRE (annuaire_etablissement) ===");

const annuaire = await must("eleve1 consulte l'annuaire", () => eleve1Client.rpc("annuaire_etablissement"));
console.log(`OK: annuaire = ${annuaire.length} profil(s), colonnes: ${Object.keys(annuaire[0] ?? {}).join(", ")}`);
if (!annuaire[0] || !("email" in annuaire[0])) { console.error("FAIL: l'annuaire devrait inclure l'email"); process.exit(1); }
if (annuaire.some((p) => p.id === eleve1.id)) { console.error("FAIL: l'annuaire ne doit pas inclure soi-même"); process.exit(1); }

console.log("\n=== NETTOYAGE ===");
await must("suppression créneau de test", () => direction.from("creneaux").delete().eq("id", creneau.id));
await must("suppression événements vie scolaire de test", () => direction.from("vie_scolaire_evenements").delete().in("id", [absence.id, sanction.id]));
await must("suppression entrée cahier de textes de test", () => prof.from("cahier_texte").delete().eq("id", entreeCahier.id));
await must("suppression actualités de test", () => direction.from("actualites").delete().in("id", [actuTous.id, actuEleves.id]));
await must("suppression événement calendrier de test", () => direction.from("evenements_calendrier").delete().eq("id", evenement.id));

console.log("\n=== TOUS LES MODULES M6 (BACKEND) ONT ÉTÉ VÉRIFIÉS AVEC SUCCÈS ===");
