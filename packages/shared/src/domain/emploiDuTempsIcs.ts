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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateIcs(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function premiereOccurrence(dateDebutAnnee: Date, jourSemaine: number, heure: string) {
  const [h, m, s] = heure.split(":").map(Number);
  const d = new Date(dateDebutAnnee);
  const diff = (jourSemaine - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(h, m, s ?? 0, 0);
  return d;
}

function echapperTexte(texte: string) {
  return texte.replace(/([,;])/g, "\\$1");
}

export function buildEmploiDuTempsIcs(
  creneaux: CreneauPourIcs[],
  anneeScolaire: { date_debut: string; date_fin: string },
) {
  const dateDebut = new Date(anneeScolaire.date_debut);
  const dateFin = new Date(anneeScolaire.date_fin);
  dateFin.setHours(23, 59, 59, 0);
  const until = formatDateIcs(dateFin);

  const lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ENT Scolaire//Emploi du temps//FR", "CALSCALE:GREGORIAN"];

  for (const c of creneaux) {
    const debut = premiereOccurrence(dateDebut, c.jour_semaine, c.heure_debut);
    const fin = premiereOccurrence(dateDebut, c.jour_semaine, c.heure_fin);
    const resume = echapperTexte(c.matiere + (c.salle ? ` (${c.salle})` : ""));

    lignes.push(
      "BEGIN:VEVENT",
      `UID:${c.id}@ent-scolaire`,
      `DTSTART:${formatDateIcs(debut)}`,
      `DTEND:${formatDateIcs(fin)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
      `SUMMARY:${resume}`,
    );
    if (c.detail) lignes.push(`DESCRIPTION:${echapperTexte(c.detail)}`);
    lignes.push("END:VEVENT");
  }

  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}
