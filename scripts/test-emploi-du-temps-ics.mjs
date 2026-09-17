// Vérifie packages/shared/src/domain/emploiDuTempsIcs.ts : logique pure,
// aucun appel réseau/Supabase — contrairement aux autres scripts de test.
// Lancé avec `npx tsx` car la fonction est en TypeScript et packages/shared
// n'a pas d'étape de build séparée (consommé en source par Vite).
import assert from "node:assert/strict";
import { buildEmploiDuTempsIcs } from "../packages/shared/src/domain/emploiDuTempsIcs.ts";

const anneeScolaire = { date_debut: "2026-09-01", date_fin: "2027-07-01" };

console.log("=== Un seul créneau (lundi 8h-9h) ===");
{
  const ics = buildEmploiDuTempsIcs(
    [{ id: "creneau-1", jour_semaine: 1, heure_debut: "08:00:00", heure_fin: "09:00:00", salle: "B12", matiere: "Maths", detail: "Mme Dupont" }],
    anneeScolaire,
  );

  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0/, "en-tête iCalendar attendu");
  assert.match(ics, /UID:creneau-1@ent-scolaire/, "UID basé sur l'id du créneau");
  // 2026-09-01 est un mardi -> le premier lundi (jour_semaine=1) suivant est le 2026-09-07.
  assert.match(ics, /DTSTART:20260907T080000/, "premier lundi après le 1er septembre 2026 (qui est un mardi)");
  assert.match(ics, /DTEND:20260907T090000/, "heure de fin correcte");
  assert.match(ics, /RRULE:FREQ=WEEKLY;UNTIL=20270701T235959/, "récurrence hebdomadaire bornée par la fin d'année scolaire");
  assert.match(ics, /SUMMARY:Maths \(B12\)/, "résumé = matière + salle");
  assert.match(ics, /DESCRIPTION:Mme Dupont/, "description = detail fourni");
  assert.match(ics, /END:VEVENT\r\nEND:VCALENDAR$/, "structure fermée correctement");
  console.log("OK: structure et calcul de date corrects");
}

console.log("\n=== Jour de la semaine exact (samedi = 6) ===");
{
  const ics = buildEmploiDuTempsIcs(
    [{ id: "creneau-samedi", jour_semaine: 6, heure_debut: "10:00:00", heure_fin: "11:00:00", matiere: "Sport" }],
    anneeScolaire,
  );
  // 2026-09-01 (mardi) -> le premier samedi suivant est le 2026-09-05.
  assert.match(ics, /DTSTART:20260905T100000/, "premier samedi après le 1er septembre 2026");
  assert.doesNotMatch(ics, /SUMMARY:Sport \(/, "pas de parenthèses de salle quand salle est absente");
  assert.match(ics, /SUMMARY:Sport\r\n/, "résumé = matière seule sans salle");
  assert.doesNotMatch(ics, /DESCRIPTION:/, "pas de ligne DESCRIPTION quand detail est absent");
  console.log("OK: absence de salle/détail gérée correctement");
}

console.log("\n=== Échappement des caractères spéciaux iCalendar ===");
{
  const ics = buildEmploiDuTempsIcs(
    [{ id: "creneau-virgule", jour_semaine: 2, heure_debut: "09:00:00", heure_fin: "10:00:00", matiere: "SVT, TP", detail: "Salle A; annexe" }],
    anneeScolaire,
  );
  assert.match(ics, /SUMMARY:SVT\\, TP/, "virgule échappée dans SUMMARY");
  assert.match(ics, /DESCRIPTION:Salle A\\; annexe/, "point-virgule échappé dans DESCRIPTION");
  console.log("OK: échappement correct des caractères réservés (, et ;)");
}

console.log("\n=== Plusieurs créneaux -> plusieurs VEVENT ===");
{
  const ics = buildEmploiDuTempsIcs(
    [
      { id: "c1", jour_semaine: 1, heure_debut: "08:00:00", heure_fin: "09:00:00", matiere: "Maths" },
      { id: "c2", jour_semaine: 3, heure_debut: "14:00:00", heure_fin: "15:00:00", matiere: "Histoire" },
    ],
    anneeScolaire,
  );
  const nbEvenements = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
  assert.equal(nbEvenements, 2, "un VEVENT par créneau");
  console.log("OK: un VEVENT généré par créneau");
}

console.log("\n=== EMPLOI DU TEMPS (.ics) VÉRIFIÉ AVEC SUCCÈS ===");
