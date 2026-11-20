type ReglagesPays = {
  nom: string;
  region: string;
  fuseau?: { identifiant: string; libelle: string; decalageFixe: string };
  calendrierOfficielFrance: boolean;
  sourceCalendrier?: string;
  evaluationsLyceePilote: boolean;
  echeanceRemiseBulletins: boolean;
  decisionConseilLycee: boolean;
};

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
} satisfies Record<string, ReglagesPays>;

export type PaysCalendrier = keyof typeof REGLAGES_PAYS;

export function lirePaysCalendrier(pays: string | null | undefined): PaysCalendrier {
  return pays && Object.prototype.hasOwnProperty.call(REGLAGES_PAYS, pays) ? pays as PaysCalendrier : "FR";
}

export function reglagesPays(pays: PaysCalendrier): ReglagesPays {
  return REGLAGES_PAYS[pays];
}

export function formatDateHeureCalendrier(iso: string, pays: PaysCalendrier, avecAnnee = true) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: avecAnnee ? "numeric" : undefined,
    hour: "2-digit", minute: "2-digit",
    timeZone: reglagesPays(pays).fuseau?.identifiant,
  });
}

export function dateHeureSaisieCalendrier(date: Date, pays: PaysCalendrier): string {
  const format = new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hourCycle: "h23", hour: "2-digit", minute: "2-digit",
    timeZone: reglagesPays(pays).fuseau?.identifiant,
  });
  const parties = Object.fromEntries(format.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parties.year}-${parties.month}-${parties.day}T${parties.hour}:${parties.minute}`;
}

export function lireDateHeureCalendrier(saisie: string, pays: PaysCalendrier): Date {
  return new Date(saisie + (reglagesPays(pays).fuseau?.decalageFixe ?? ""));
}
