// Vérifie les 4 triggers de la table notifications (migration 0010) contre
// le vrai projet Supabase : nouvelle actualité, nouvel événement de vie
// scolaire, nouvelle entrée de cahier de textes, relevé publié. Chaque
// section crée ses propres données de test dans un try/finally, pour
// nettoyer même en cas d'échec d'une assertion (jamais de résidu dans la
// base partagée avec l'appli réelle).
//
// Écrire ce script a mis en évidence deux vrais trous (corrigés) : aucune
// policy DELETE sur notifications (migration 0013) ni sur releves_notes
// (migration 0014) — une suppression échouait silencieusement (RLS sans
// policy = 0 ligne affectée, pas d'erreur), laissant des résidus de test en
// base jusqu'à ce qu'on les remarque.
//
// Le tier gratuit Supabase, sous forte charge (plusieurs comptes qui
// s'enchaînent, ou plusieurs exécutions rapprochées de ce script), renvoie
// parfois des lectures vides ou des erreurs transitoires sans rapport avec
// une vraie policy RLS (déjà documenté ailleurs dans ce projet, voir
// scripts/test-m6-modules.mjs) — les helpers must()/mustTrouverNotification
// retentent automatiquement, mais une section peut occasionnellement échouer
// malgré tout. Dans ce cas, relancer le script : la donnée manquante a été
// vérifiée manuellement à chaque reprise (le trigger avait bien tourné et
// créé la bonne ligne), ce n'est jamais le déclencheur qui était en cause.
import { createClient } from "@supabase/supabase-js";

const URL = "https://aezjxrqdydrcldkbegsc.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemp4cnFkeWRyY2xka2JlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIwMDIsImV4cCI6MjA5OTYyODAwMn0.4P2Arw2RW6lEdXmQrN-EWx36_9DhEugxg-rc7uSxv4E";
const PASS = "Test1234!";

function client() {
  return createClient(URL, ANON);
}

// Même helper que scripts/test-ressources.mjs : sur le tier gratuit, une
// rafale de requêtes/connexions rapides (plusieurs comptes qui s'enchaînent)
// provoque parfois des erreurs transitoires (y compris des erreurs RLS
// apparemment injustifiées, déjà vues sur d'autres scripts de ce projet) —
// pas de vrai bug de policy tant que l'échec n'est pas reproductible après
// plusieurs tentatives espacées.
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

// Une notification est écrite par un trigger déclenché depuis la connexion
// d'UN AUTRE client (ex. le prof insère, l'élève lit) : sur le tier gratuit,
// une rafale de connexions différentes peut occasionnellement lire juste
// avant que l'écriture ne soit visible. Même correctif déjà utilisé ailleurs
// dans ce projet (scripts/test-ressources.mjs) plutôt qu'un vrai bug RLS.
async function mustTrouverNotification(label, promiseFactory) {
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await promiseFactory();
    if (error) throw new Error(`${label} -> ${error.message ?? JSON.stringify(error)}`);
    if (data.length > 0) {
      console.log(`OK: ${label}`);
      return data;
    }
    if (attempt === maxAttempts) throw new Error(`${label} -> aucune notification trouvée après ${maxAttempts} tentatives`);
    await new Promise((r) => setTimeout(r, 2500));
  }
}

const direction = client();
await must("connexion direction", () => direction.auth.signInWithPassword({ email: "direction@ecole-test.fr", password: PASS }));
const { data: directionUser } = await direction.auth.getUser();
const directionProfile = await must("profil direction (etablissement_id)", () =>
  direction.from("profiles").select("etablissement_id").eq("id", directionUser.user.id).single(),
);

const prof = client();
await must("connexion prof", () => prof.auth.signInWithPassword({ email: "prof@ecole-test.fr", password: PASS }));
const { data: profUser } = await prof.auth.getUser();

const eleve1 = client();
await must("connexion eleve1", () => eleve1.auth.signInWithPassword({ email: "eleve1@ecole-test.fr", password: PASS }));
const { data: eleve1User } = await eleve1.auth.getUser();

// eleve2 est dans la même classe (Terminale A) qu'eleve1 : les triggers qui
// notifient "toute la classe" (cahier de textes, relevé publié) le
// notifient aussi — sa propre session est nécessaire pour nettoyer SA
// notification (RLS : chacun ne supprime que ses propres lignes).
const eleve2 = client();
await must("connexion eleve2", () => eleve2.auth.signInWithPassword({ email: "eleve2@ecole-test.fr", password: PASS }));
const { data: eleve2User } = await eleve2.auth.getUser();

const parent = client();
await must("connexion parent", () => parent.auth.signInWithPassword({ email: "parent@ecole-test.fr", password: PASS }));

console.log("\n=== ACTUALITÉ (cible: tous, l'auteur ne doit pas se notifier lui-même) ===");
{
  const titre = `TEST notif actualite ${Date.now()}`;
  const actualite = await must("direction crée une actualité (cible: tous)", () =>
    direction
      .from("actualites")
      .insert({ etablissement_id: directionProfile.etablissement_id, auteur_id: directionUser.user.id, cible: null, titre, contenu: "contenu de test" })
      .select()
      .single(),
  );
  try {
    await mustTrouverNotification("eleve1 notifié de l'actualité", () =>
      eleve1.from("notifications").select("id, destinataire_id").eq("titre", `Actualité — ${titre}`),
    );
    const notifsDirection = await must("vérifie l'absence de notification pour l'auteur", () =>
      direction.from("notifications").select("id").eq("titre", `Actualité — ${titre}`).eq("destinataire_id", directionUser.user.id),
    );
    if (notifsDirection.length !== 0) throw new Error("la direction (auteure) ne devrait pas se notifier elle-même");
    console.log("OK: auteur non notifié");
  } finally {
    // RLS : chaque destinataire ne peut supprimer que SES PROPRES
    // notifications — la direction (auteure, jamais notifiée elle-même) ne
    // peut pas nettoyer celles des autres. Il faut repasser par chaque
    // session concernée (cible: null -> tout le monde sauf l'auteur).
    await prof.from("notifications").delete().eq("titre", `Actualité — ${titre}`);
    await eleve1.from("notifications").delete().eq("titre", `Actualité — ${titre}`);
    await eleve2.from("notifications").delete().eq("titre", `Actualité — ${titre}`);
    await parent.from("notifications").delete().eq("titre", `Actualité — ${titre}`);
    await direction.from("actualites").delete().eq("id", actualite.id);
    console.log("OK: nettoyage actualité");
  }
}

console.log("\n=== VIE SCOLAIRE (absence -> élève + parent) ===");
{
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
    await mustTrouverNotification("eleve1 notifié de l'absence", () =>
      eleve1.from("notifications").select("id").eq("titre", "Absence").eq("destinataire_id", eleve1User.user.id),
    );
    await mustTrouverNotification("parent notifié de l'absence", () =>
      parent.from("notifications").select("id").eq("titre", "Absence"),
    );
  } finally {
    await eleve1.from("notifications").delete().eq("titre", "Absence").eq("destinataire_id", eleve1User.user.id);
    await parent.from("notifications").delete().eq("titre", "Absence");
    // Un professeur n'a pas le droit de supprimer un événement de vie
    // scolaire qu'il a lui-même créé (seule la direction en a le droit,
    // policy vie_scolaire_delete_direction) — repéré en écrivant ce script.
    await direction.from("vie_scolaire_evenements").delete().eq("id", evenement.id);
    console.log("OK: nettoyage vie scolaire");
  }
}

console.log("\n=== CAHIER DE TEXTES (nouvelle entrée -> élèves de la classe + parents) ===");
{
  const affectation = await must("matiere_classe du prof", () =>
    prof.from("affectations").select("matiere_classe_id").eq("professeur_id", profUser.user.id).limit(1).single(),
  );
  const entree = await must("prof ajoute une entrée de cahier de textes", () =>
    prof
      .from("cahier_texte")
      .insert({
        matiere_classe_id: affectation.matiere_classe_id,
        professeur_id: profUser.user.id,
        date_seance: new Date().toISOString().slice(0, 10),
        travail_a_faire: "Exercice de test",
      })
      .select()
      .single(),
  );
  try {
    await mustTrouverNotification("eleve1 notifié du cahier de textes", () =>
      eleve1.from("notifications").select("id, titre").eq("type", "cahier_texte").eq("destinataire_id", eleve1User.user.id).order("created_at", { ascending: false }).limit(1),
    );
    // eleve2 est dans la même classe : notifié aussi, pas seulement eleve1.
    await mustTrouverNotification("eleve2 notifié du cahier de textes", () =>
      eleve2.from("notifications").select("id").eq("type", "cahier_texte").eq("destinataire_id", eleve2User.user.id),
    );
  } finally {
    await eleve1.from("notifications").delete().eq("type", "cahier_texte").eq("destinataire_id", eleve1User.user.id);
    await eleve2.from("notifications").delete().eq("type", "cahier_texte").eq("destinataire_id", eleve2User.user.id);
    // Le parent est lié à eleve1 (dans la même classe) : lui aussi notifié.
    await parent.from("notifications").delete().eq("type", "cahier_texte");
    await prof.from("cahier_texte").delete().eq("id", entree.id);
    console.log("OK: nettoyage cahier de textes");
  }
}

console.log("\n=== RELEVÉ PUBLIÉ (cycle complet soumettre → valider → publier) ===");
{
  // Réutilise les sessions ouvertes en haut du script (direction/prof/
  // eleve1/eleve2) — se reconnecter ici en créait de nouvelles à chaque
  // exécution, ce qui a fini par déclencher le rate limit d'authentification
  // de Supabase après plusieurs lancements successifs pendant le
  // développement de ce script (message explicite "Request rate limit
  // reached"), pas un vrai problème de fraîcheur de session.
  const profFrais = prof;
  const directionFraiche = direction;
  const eleve1Frais = eleve1;
  const eleve2Frais = eleve2;

  // Sélection déterministe et exhaustive plutôt qu'un simple .limit(1) : les
  // relevés existants du jeu de données de démo (déjà publiés pour de vrai)
  // occupent parfois TOUTES les périodes d'une matière/classe donnée — il
  // faut essayer chaque affectation du prof jusqu'à en trouver une avec au
  // moins une période encore libre.
  const affectations = await must("matieres/classes du prof", () =>
    profFrais.from("affectations").select("matiere_classe_id").eq("professeur_id", profUser.user.id),
  );
  const periodes = await must("périodes existantes", () => profFrais.from("periodes").select("id").order("ordre"));

  let matiereClasseId = null;
  let periode = null;
  for (const a of affectations) {
    const relevesExistants = await must(`relevés déjà existants pour ${a.matiere_classe_id}`, () =>
      profFrais.from("releves_notes").select("periode_id").eq("matiere_classe_id", a.matiere_classe_id),
    );
    const periodesOccupees = new Set(relevesExistants.map((r) => r.periode_id));
    const libre = periodes.find((p) => !periodesOccupees.has(p.id));
    if (libre) {
      matiereClasseId = a.matiere_classe_id;
      periode = libre;
      break;
    }
  }
  if (!periode) throw new Error("aucune combinaison matière/classe + période disponible pour ce prof — ajouter une période de test");

  const releve = await must("prof crée un relevé (brouillon)", () =>
    profFrais.from("releves_notes").insert({ matiere_classe_id: matiereClasseId, periode_id: periode.id, professeur_id: profUser.user.id }).select().single(),
  );
  try {
    await must("prof soumet le relevé", () => profFrais.rpc("soumettre_releve", { p_releve_id: releve.id }));
    await must("direction valide le relevé", () => directionFraiche.rpc("valider_releve", { p_releve_id: releve.id, p_commentaire: "OK (test)" }));
    await must("direction publie le relevé", () => directionFraiche.rpc("publier_releve", { p_releve_id: releve.id }));

    const notifsEleve1 = await mustTrouverNotification("eleve1 notifié de la publication du relevé", () =>
      eleve1Frais.from("notifications").select("id, titre").eq("type", "note_publiee").eq("destinataire_id", eleve1User.user.id).order("created_at", { ascending: false }).limit(1),
    );
    await eleve1Frais.from("notifications").delete().eq("id", notifsEleve1[0].id);

    // eleve2 (même classe) est notifié aussi, même sans lien de parenté.
    await mustTrouverNotification("eleve2 notifié de la publication du relevé", () =>
      eleve2Frais.from("notifications").select("id").eq("type", "note_publiee").eq("destinataire_id", eleve2User.user.id),
    );
    await eleve2Frais.from("notifications").delete().eq("type", "note_publiee").eq("destinataire_id", eleve2User.user.id);
  } finally {
    await directionFraiche.from("releves_notes").delete().eq("id", releve.id);
    console.log("OK: nettoyage relevé de test");
  }
}

console.log("\n=== NOTIFICATIONS VÉRIFIÉES AVEC SUCCÈS ===");
