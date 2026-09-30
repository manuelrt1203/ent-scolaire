import type { Role } from "./structure";

/* Dates officielles affichées en lecture seule dans le calendrier, à côté des
 * événements saisis par la direction :
 * - vacances scolaires : data.education.gouv.fr (jeu « fr-en-calendrier-scolaire »), par académie
 * - jours fériés : Nager.Date (France métropolitaine, jours « global » uniquement)
 * Les deux API sont publiques, sans clé, et envoient Access-Control-Allow-Origin: *. */

const CALENDRIER_SCOLAIRE_URL =
  "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records";
const JOURS_FERIES_URL = "https://date.nager.at/api/v3/PublicHolidays";

/** Valeurs du champ `location` du jeu de données, avec leur zone. Caen et Rouen n'y
 * figurent plus que pour l'historique : fusionnées dans « Normandie » depuis 2020. */
export const ACADEMIES: { nom: string; zone: string }[] = [
  { nom: "Aix-Marseille", zone: "B" }, { nom: "Amiens", zone: "B" }, { nom: "Besançon", zone: "A" },
  { nom: "Bordeaux", zone: "A" }, { nom: "Clermont-Ferrand", zone: "A" },
  { nom: "Corse", zone: "Corse" }, { nom: "Créteil", zone: "C" }, { nom: "Dijon", zone: "A" },
  { nom: "Grenoble", zone: "A" }, { nom: "Lille", zone: "B" }, { nom: "Limoges", zone: "A" },
  { nom: "Lyon", zone: "A" }, { nom: "Montpellier", zone: "C" }, { nom: "Nancy-Metz", zone: "B" },
  { nom: "Nantes", zone: "B" }, { nom: "Nice", zone: "B" }, { nom: "Normandie", zone: "B" },
  { nom: "Orléans-Tours", zone: "B" }, { nom: "Paris", zone: "C" }, { nom: "Poitiers", zone: "A" },
  { nom: "Reims", zone: "B" }, { nom: "Rennes", zone: "B" },
  { nom: "Strasbourg", zone: "B" }, { nom: "Toulouse", zone: "C" }, { nom: "Versailles", zone: "C" },
  { nom: "Guadeloupe", zone: "Outre-mer" }, { nom: "Guyane", zone: "Outre-mer" },
  { nom: "Martinique", zone: "Outre-mer" }, { nom: "Mayotte", zone: "Outre-mer" },
  { nom: "Nouvelle Calédonie", zone: "Outre-mer" }, { nom: "Polynésie", zone: "Outre-mer" },
  { nom: "Réunion", zone: "Outre-mer" }, { nom: "Saint Pierre et Miquelon", zone: "Outre-mer" },
  { nom: "Wallis et Futuna", zone: "Outre-mer" },
];

export interface DateOfficielle {
  id: string;
  type: "vacances" | "ferie";
  titre: string;
  /** Premier jour, AAAA-MM-JJ */
  debut: string;
  /** Dernier jour inclus, AAAA-MM-JJ */
  fin: string;
  /** Jour de reprise des cours (vacances uniquement), AAAA-MM-JJ */
  reprise: string | null;
}

interface VacancesRecord {
  description: string;
  population: string;
  start_date: string;
  end_date: string;
}

interface JourFerie {
  date: string;
  localName: string;
  global: boolean;
}

/** Le jeu de données donne minuit heure locale exprimé en UTC (ex. 22:00Z la veille
 * pour Paris l'été). +12 h retombe sur le bon jour pour tous les fuseaux de UTC-10
 * (Polynésie) à UTC+12 (Wallis), sans dépendre du support Intl des fuseaux (Hermes). */
function jourLocal(iso: string): string {
  return new Date(new Date(iso).getTime() + 12 * 3600_000).toISOString().slice(0, 10);
}

function veille(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** « Élèves » / « Enseignants » : l'été se termine un jour plus tôt pour les profs (prérentrée). */
function concerne(population: string, role: Role | undefined): boolean {
  if (population === "-" || !population) return true;
  const personnel = role === "direction" || role === "professeur";
  return personnel ? population === "Enseignants" : population === "Élèves";
}

export async function getVacancesScolaires(
  academie: string,
  role: Role | undefined,
  depuis: Date,
  jusqua: Date,
): Promise<DateOfficielle[]> {
  const where = `location="${academie.replace(/"/g, "")}" and end_date>="${depuis.toISOString()}" and start_date<="${jusqua.toISOString()}"`;
  const url = `${CALENDRIER_SCOLAIRE_URL}?where=${encodeURIComponent(where)}&order_by=start_date&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Calendrier scolaire indisponible (${res.status})`);
  const { results } = (await res.json()) as { results: VacancesRecord[] };

  return results
    .filter((r) => concerne(r.population, role))
    .map((r) => {
      const debut = jourLocal(r.start_date);
      const finJeu = jourLocal(r.end_date);
      // Un pont a start_date = end_date : un seul jour chômé, pas de « reprise » distincte
      const pont = debut === finJeu;
      return {
        id: `vacances-${debut}-${r.description}`,
        type: "vacances" as const,
        titre: r.description,
        debut,
        fin: pont ? debut : veille(finJeu),
        reprise: pont ? null : finJeu,
      };
    });
}

export async function getJoursFeries(annees: number[]): Promise<DateOfficielle[]> {
  const parAnnee = await Promise.all(
    annees.map(async (annee) => {
      const res = await fetch(`${JOURS_FERIES_URL}/${annee}/FR`);
      if (!res.ok) throw new Error(`Jours fériés indisponibles (${res.status})`);
      return (await res.json()) as JourFerie[];
    }),
  );
  return parAnnee
    .flat()
    // Les jours non « global » ne concernent que l'Alsace-Moselle (Vendredi saint, Saint-Étienne)
    .filter((j) => j.global)
    .map((j) => ({ id: `ferie-${j.date}`, type: "ferie" as const, titre: j.localName, debut: j.date, fin: j.date, reprise: null }));
}

/** Vacances (si l'académie est connue) + jours fériés, sur les 12 prochains mois, triés. */
export async function getDatesOfficielles(academie: string | null, role: Role | undefined, maintenant = new Date()) {
  const dans1an = new Date(maintenant);
  dans1an.setFullYear(dans1an.getFullYear() + 1);
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  const limite = dans1an.toISOString().slice(0, 10);

  const [vacances, feries] = await Promise.all([
    academie ? getVacancesScolaires(academie, role, maintenant, dans1an) : Promise.resolve([]),
    getJoursFeries([maintenant.getFullYear(), dans1an.getFullYear()]),
  ]);

  return [...vacances, ...feries]
    .filter((d) => d.fin >= aujourdhui && d.debut <= limite)
    .sort((a, b) => a.debut.localeCompare(b.debut));
}
