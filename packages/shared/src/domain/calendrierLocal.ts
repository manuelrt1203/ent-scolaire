type FuseauCalendrier = { identifiant: string; libelle: string; decalageFixe: string };

type ReglagesPays = {
  nom: string;
  region: string;
  fuseau?: FuseauCalendrier;
  autresFuseaux?: readonly FuseauCalendrier[];
  calendrierOfficielFrance: boolean;
  sourceCalendrier?: string;
  evaluationsLyceePilote: boolean;
  echeanceRemiseBulletins: boolean;
  decisionConseilLycee: boolean;
};

function calendrierAfriqueCentrale(nom: string, fuseau: FuseauCalendrier, autresFuseaux?: readonly FuseauCalendrier[]): ReglagesPays {
  return {
    nom, region: "Afrique centrale", fuseau, autresFuseaux,
    calendrierOfficielFrance: false,
    evaluationsLyceePilote: false,
    echeanceRemiseBulletins: false,
    decisionConseilLycee: false,
  };
}

export const REGLAGES_PAYS = {
  FR: {
    nom: "France",
    region: "Europe occidentale",
    calendrierOfficielFrance: true,
    evaluationsLyceePilote: false,
    echeanceRemiseBulletins: false,
    decisionConseilLycee: false,
  },
  CG: {
    nom: "République du Congo (Brazzaville)",
    region: "Afrique centrale",
    fuseau: { identifiant: "Africa/Brazzaville", libelle: "heure de Brazzaville", decalageFixe: "+01:00" },
    calendrierOfficielFrance: false,
    evaluationsLyceePilote: true,
    echeanceRemiseBulletins: true,
    decisionConseilLycee: false,
  },
  GA: {
    nom: "Gabon",
    region: "Afrique centrale",
    fuseau: { identifiant: "Africa/Libreville", libelle: "heure de Libreville", decalageFixe: "+01:00" },
    calendrierOfficielFrance: false,
    sourceCalendrier: "https://education-nationale.gouv.ga/calendrier-scolaire/",
    evaluationsLyceePilote: false,
    echeanceRemiseBulletins: false,
    decisionConseilLycee: true,
  },
  AO: calendrierAfriqueCentrale("Angola", { identifiant: "Africa/Luanda", libelle: "heure de Luanda", decalageFixe: "+01:00" }),
  CM: calendrierAfriqueCentrale("Cameroun", { identifiant: "Africa/Douala", libelle: "heure du Cameroun", decalageFixe: "+01:00" }),
  CF: calendrierAfriqueCentrale("République centrafricaine", { identifiant: "Africa/Bangui", libelle: "heure de Bangui", decalageFixe: "+01:00" }),
  TD: calendrierAfriqueCentrale("Tchad", { identifiant: "Africa/Ndjamena", libelle: "heure de N’Djamena", decalageFixe: "+01:00" }),
  CD: calendrierAfriqueCentrale(
    "République démocratique du Congo (RDC)",
    { identifiant: "Africa/Kinshasa", libelle: "heure de Kinshasa (ouest, UTC+1)", decalageFixe: "+01:00" },
    [{ identifiant: "Africa/Lubumbashi", libelle: "heure de Lubumbashi (est, UTC+2)", decalageFixe: "+02:00" }],
  ),
  GQ: calendrierAfriqueCentrale("Guinée équatoriale", { identifiant: "Africa/Malabo", libelle: "heure de Guinée équatoriale", decalageFixe: "+01:00" }),
  ST: calendrierAfriqueCentrale("São Tomé-et-Príncipe", { identifiant: "Africa/Sao_Tome", libelle: "heure de São Tomé", decalageFixe: "+00:00" }),
} satisfies Record<string, ReglagesPays>;

export type PaysCalendrier = keyof typeof REGLAGES_PAYS;

export function lirePaysCalendrier(pays: string | null | undefined): PaysCalendrier {
  return pays && Object.prototype.hasOwnProperty.call(REGLAGES_PAYS, pays) ? pays as PaysCalendrier : "FR";
}

export function reglagesPays(pays: PaysCalendrier): ReglagesPays {
  return REGLAGES_PAYS[pays];
}

export function fuseauxCalendrier(pays: PaysCalendrier) {
  const { fuseau, autresFuseaux } = reglagesPays(pays);
  return fuseau ? [fuseau, ...(autresFuseaux ?? [])] : [];
}

export function fuseauCalendrier(pays: PaysCalendrier, identifiant?: string | null) {
  const options = fuseauxCalendrier(pays);
  return options.find((option) => option.identifiant === identifiant) ?? options[0];
}

export function formatDateHeureCalendrier(iso: string, pays: PaysCalendrier, avecAnnee = true, fuseau?: string | null) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: avecAnnee ? "numeric" : undefined,
    hour: "2-digit", minute: "2-digit",
    timeZone: fuseauCalendrier(pays, fuseau)?.identifiant,
  });
}

export function dateHeureSaisieCalendrier(date: Date, pays: PaysCalendrier, fuseau?: string | null): string {
  const format = new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hourCycle: "h23", hour: "2-digit", minute: "2-digit",
    timeZone: fuseauCalendrier(pays, fuseau)?.identifiant,
  });
  const parties = Object.fromEntries(format.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parties.year}-${parties.month}-${parties.day}T${parties.hour}:${parties.minute}`;
}

export function lireDateHeureCalendrier(saisie: string, pays: PaysCalendrier, fuseau?: string | null): Date {
  return new Date(saisie + (fuseauCalendrier(pays, fuseau)?.decalageFixe ?? ""));
}
