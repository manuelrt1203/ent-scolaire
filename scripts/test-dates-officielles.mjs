// Vérifie packages/shared/src/api/calendrierOfficiel.ts contre les vraies API
// publiques (data.education.gouv.fr + Nager.Date) : appels réseau, pas de Supabase.
// Les dates attendues sont celles publiées au Bulletin officiel pour 2026-2027.
import assert from "node:assert/strict";
import { getDatesOfficielles, getVacancesScolaires, getJoursFeries, ACADEMIES } from "../packages/shared/src/api/calendrierOfficiel.ts";
import { formatDateOfficielle } from "../packages/shared/src/domain/datesOfficielles.ts";

const depuis = new Date("2026-09-01T00:00:00Z");
const jusqua = new Date("2027-09-30T00:00:00Z");

console.log("=== Vacances Montpellier (zone C), vue élève ===");
const eleve = await getVacancesScolaires("Montpellier", "eleve", depuis, jusqua);
eleve.forEach((v) => console.log(" ", v.titre.padEnd(26), formatDateOfficielle(v)));
const toussaint = eleve.find((v) => v.titre.includes("Toussaint"));
assert.deepEqual(
  { debut: toussaint.debut, fin: toussaint.fin, reprise: toussaint.reprise },
  { debut: "2026-10-17", fin: "2026-11-01", reprise: "2026-11-02" },
);
const pont = eleve.find((v) => v.titre.includes("Ascension"));
assert.equal(pont.debut, pont.fin, "un pont dure un seul jour");
assert.equal(pont.reprise, null);
const eteEleve = eleve.find((v) => v.titre.includes("Été"));
assert.equal(eleve.filter((v) => v.titre.includes("Été")).length, 1, "une seule ligne Été par population");

console.log("=== Même académie, vue professeur : l'été se termine plus tôt (prérentrée) ===");
const prof = await getVacancesScolaires("Montpellier", "professeur", depuis, jusqua);
const eteProf = prof.find((v) => v.titre.includes("Été"));
console.log("  élève :", formatDateOfficielle(eteEleve), "\n  prof  :", formatDateOfficielle(eteProf));
assert.ok(eteProf.reprise < eteEleve.reprise);

console.log("=== Outre-mer (fuseau UTC+4) : jours cohérents ===");
const reunion = await getVacancesScolaires("Réunion", "eleve", depuis, jusqua);
assert.ok(reunion.length > 0);
reunion.slice(0, 2).forEach((v) => console.log(" ", v.titre.padEnd(26), formatDateOfficielle(v)));
reunion.forEach((v) => assert.ok(v.debut <= v.fin));

console.log("=== Jours fériés 2027 (hors Alsace-Moselle) ===");
const feries = await getJoursFeries([2027]);
console.log(" ", feries.map((f) => `${f.debut} ${f.titre}`).join("\n  "));
assert.equal(feries.length, 11);
assert.ok(!feries.some((f) => f.titre.includes("Saint-Étienne")));

console.log("=== Agrégat : sans académie → uniquement les fériés, triés ===");
const sansAcademie = await getDatesOfficielles(null, "eleve", depuis);
assert.ok(sansAcademie.every((d) => d.type === "ferie"));
const avec = await getDatesOfficielles("Montpellier", "eleve", depuis);
assert.deepEqual(avec.map((d) => d.debut), [...avec.map((d) => d.debut)].sort());
assert.ok(avec.some((d) => d.type === "vacances"));

console.log("=== Les 34 académies existent bien dans le jeu de données ===");
for (const a of ACADEMIES) {
  const v = await getVacancesScolaires(a.nom, "eleve", depuis, jusqua);
  assert.ok(v.length > 0, `aucune donnée pour ${a.nom}`);
}

console.log("\n✅ Tous les tests passent");
