/** Génère un export .ics de l'emploi du temps — permet de l'importer dans
 * Google Calendar/Outlook/l'appli calendrier du téléphone plutôt que de
 * devoir toujours ouvrir l'ENT pour vérifier son planning. Pas de
 * dépendance : le format iCalendar (RFC 5545) est un texte simple. Horaires
 * "flottants" (sans fuseau) — l'app calendrier de l'utilisateur les
 * interprète dans son fuseau local, ce qui correspond à l'usage réel
 * (l'emploi du temps est toujours donné à l'heure locale de l'établissement).
 */

export interface CreneauPourIcs {
  id: string;
  jour_semaine: number; // 1 = lundi ... 6 = samedi (correspond à Date.getDay() sauf dimanche=0, non utilisé ici)
  heure_debut: string; // "HH:MM:SS"
  heure_fin: string;
  salle?: string | null;
  matiere: string;
  detail?: string | null;
}

export interface ExceptionPourIcs {
  creneau_id: string;
  date: string;
  annule: boolean;
  heure_debut: string | null;
  heure_fin: string | null;
  salle: string | null;
}

function dateHeureIcs(date: string, heure: string) {
  const [h, m, s = "00"] = heure.split(":");
  return `${date.replaceAll("-", "")}T${h}${m}${s.slice(0, 2)}`;
}

function premiereOccurrence(dateDebutAnnee: string, jourSemaine: number) {
  const date = new Date(`${dateDebutAnnee}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (jourSemaine - date.getUTCDay() + 7) % 7);
  return date.toISOString().slice(0, 10);
}

function echapperTexte(texte: string) {
  return texte.replace(/([\\,;])/g, "\\$1").replace(/\r\n|\r|\n/g, "\\n");
}

function ajouterDetails(lignes: string[], creneau: CreneauPourIcs, salle = creneau.salle) {
  lignes.push(`SUMMARY:${echapperTexte(creneau.matiere + (salle ? ` (${salle})` : ""))}`);
  if (salle) lignes.push(`LOCATION:${echapperTexte(salle)}`);
  if (creneau.detail) lignes.push(`DESCRIPTION:${echapperTexte(creneau.detail)}`);
  lignes.push("END:VEVENT");
}

export function buildEmploiDuTempsIcs(
  creneaux: CreneauPourIcs[],
  anneeScolaire: { date_debut: string; date_fin: string },
  exceptions: ExceptionPourIcs[] = [],
) {
  const until = dateHeureIcs(anneeScolaire.date_fin, "23:59:59");
  const dtstamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ENT Scolaire//Emploi du temps//FR", "CALSCALE:GREGORIAN"];

  for (const c of creneaux) {
    const premiereDate = premiereOccurrence(anneeScolaire.date_debut, c.jour_semaine);
    if (premiereDate > anneeScolaire.date_fin) continue;
    const ponctuelles = exceptions.filter((exception) =>
      exception.creneau_id === c.id && exception.date >= premiereDate && exception.date <= anneeScolaire.date_fin
    );
    const uid = `UID:${c.id}@ent-scolaire`;
    lignes.push(
      "BEGIN:VEVENT",
      uid,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dateHeureIcs(premiereDate, c.heure_debut)}`,
      `DTEND:${dateHeureIcs(premiereDate, c.heure_fin)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
    );
    for (const exception of ponctuelles) {
      if (exception.annule) lignes.push(`EXDATE:${dateHeureIcs(exception.date, c.heure_debut)}`);
    }
    ajouterDetails(lignes, c);

    for (const exception of ponctuelles) {
      if (exception.annule || !exception.heure_debut || !exception.heure_fin) continue;
      lignes.push(
        "BEGIN:VEVENT",
        uid,
        `DTSTAMP:${dtstamp}`,
        `RECURRENCE-ID:${dateHeureIcs(exception.date, c.heure_debut)}`,
        `DTSTART:${dateHeureIcs(exception.date, exception.heure_debut)}`,
        `DTEND:${dateHeureIcs(exception.date, exception.heure_fin)}`,
      );
      ajouterDetails(lignes, c, exception.salle);
    }
  }

  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}
