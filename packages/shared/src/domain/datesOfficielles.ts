import type { DateOfficielle } from "../api/calendrierOfficiel";

/** « 2026-10-17 » → Date locale à midi (évite tout décalage de fuseau à l'affichage) */
function jour(iso: string) {
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(a, m - 1, j, 12);
}

const fmt = (iso: string) => jour(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

/** « Du sam. 17 oct. au dim. 1 nov. · reprise lun. 2 nov. » ou « jeu. 1 janv. » */
export function formatDateOfficielle(d: DateOfficielle): string {
  const periode = d.debut === d.fin ? fmt(d.debut) : `Du ${fmt(d.debut)} au ${fmt(d.fin)}`;
  return d.reprise ? `${periode} · reprise ${fmt(d.reprise)}` : periode;
}

/** Date de tri commune aux événements (ISO complet) et aux dates officielles (AAAA-MM-JJ) */
export function cleDeTri(item: { date_debut: string } | DateOfficielle): string {
  return "date_debut" in item ? item.date_debut : `${item.debut}T00:00:00`;
}
