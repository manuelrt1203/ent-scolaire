export type PaysCalendrier = "FR" | "CG";

export const PAYS_CALENDRIER: Record<PaysCalendrier, string> = {
  FR: "France",
  CG: "République du Congo (Brazzaville)",
};

const fuseauBrazzaville = "Africa/Brazzaville";

export function formatDateHeureCalendrier(iso: string, pays: PaysCalendrier, avecAnnee = true) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: avecAnnee ? "numeric" : undefined,
    hour: "2-digit", minute: "2-digit",
    timeZone: pays === "CG" ? fuseauBrazzaville : undefined,
  });
}

export function dateHeureSaisieCalendrier(date: Date, pays: PaysCalendrier): string {
  const format = new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hourCycle: "h23", hour: "2-digit", minute: "2-digit",
    timeZone: pays === "CG" ? fuseauBrazzaville : undefined,
  });
  const parties = Object.fromEntries(format.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parties.year}-${parties.month}-${parties.day}T${parties.hour}:${parties.minute}`;
}

export function lireDateHeureCalendrier(saisie: string, pays: PaysCalendrier): Date {
  // Brazzaville utilise UTC+1 toute l'année.
  return new Date(pays === "CG" ? `${saisie}+01:00` : saisie);
}
