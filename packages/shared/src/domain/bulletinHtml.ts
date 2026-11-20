import type { getDetailsBulletin } from "../api/notes";
import type { Tables } from "../types/database.types";
import { formatMoyenne } from "./moyenne";

export interface BulletinHtmlInput {
  etablissementNom: string;
  eleveNom: string;
  elevePrenom: string;
  details: Awaited<ReturnType<typeof getDetailsBulletin>>;
  periodeNom: string;
  lignes: Tables<"v_bulletin">[];
}

function echapper(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function afficherNote(note: number | null | undefined): string {
  return note == null ? "—" : note.toFixed(2).replace(".", ",");
}

/** Les moyennes officielles sont lues dans le relevé publié. */
export function buildBulletinHtml(input: BulletinHtmlInput): string {
  const classes = new Map(
    input.details.flatMap(({ releves_notes }) => {
      const classe = releves_notes?.matiere_classe?.classes;
      return classe ? [[classe.id, classe] as const] : [];
    }),
  );
  const classe = classes.size === 1 ? [...classes.values()][0] : undefined;
  const evaluations = new Map<string, BulletinHtmlInput["details"]>();
  for (const detail of input.details) {
    const id = detail.releves_notes?.matiere_classe_id;
    if (!id || ![detail.devoir_1, detail.devoir_2, detail.devoir_departemental, detail.composition].some((note) => note != null)) continue;
    const notes = evaluations.get(id) ?? [];
    notes.push(detail);
    evaluations.set(id, notes);
  }
  const lycee = classe?.cycle === "lycee" || evaluations.size > 0;
  const identiteClasse = [
    classe?.nom,
    classe?.niveau !== classe?.nom ? classe?.niveau : null,
    classe?.serie ? `Série ${classe.serie}` : null,
    input.periodeNom,
    classe?.annees_scolaires?.libelle,
  ].filter(Boolean).map((texte) => echapper(texte!)).join(" · ");

  const lignesHtml = input.lignes.map((ligne) => {
    const details = evaluations.get(ligne.matiere_classe_id ?? "");
    const detail = details?.length === 1 ? details[0] : undefined;
    const devoirs = [detail?.devoir_1, detail?.devoir_2, detail?.devoir_departemental];
    const moyenneDevoirs = devoirs.every((note) => note != null)
      ? devoirs.reduce<number>((somme, note) => somme + (note ?? 0), 0) / devoirs.length
      : null;
    const notes = lycee
      ? [...devoirs, moyenneDevoirs, detail?.composition]
          .map((note) => `<td class="centre">${afficherNote(note)}</td>`).join("")
      : "";
    const points = ligne.moyenne == null || ligne.coefficient == null ? null : ligne.moyenne * ligne.coefficient;
    return `
        <tr>
          <td>${echapper(ligne.matiere ?? "")}</td>
          ${notes}
          <td class="centre">${ligne.coefficient ?? ""}</td>
          <td class="centre">${formatMoyenne(ligne.moyenne)}</td>
          ${lycee ? `<td class="centre">${afficherNote(points)}</td>` : ""}
        </tr>`;
  }).join("");

  // L'export reflète les seules disciplines publiées qu'il contient.
  const { points, coefficients } = input.lignes.reduce((total, ligne) => {
    if (ligne.moyenne != null && ligne.coefficient != null) {
      const coefficient = Math.round(ligne.coefficient * 100);
      total.points += Math.round(ligne.moyenne * 100) * coefficient;
      total.coefficients += coefficient;
    }
    return total;
  }, { points: 0, coefficients: 0 });
  const moyenne = coefficients > 0 ? Math.round(points / coefficients) / 100 : null;

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Bulletin scolaire</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .etablissement { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          .identite { margin-bottom: 20px; font-size: 13px; }
          .identite strong { font-size: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; text-align: left; }
          thead { display: table-header-group; }
          tr, .moyenne-generale, .visa { break-inside: avoid; }
          .lycee th, .lycee td { padding: 6px; font-size: 11px; }
          .visa { margin-top: 24px; text-align: right; font-size: 13px; }
          @media print {
            body { padding: 0; }
            .moyenne-generale { background: white; color: #0f172a; border: 1px solid #cbd5e1; }
            .moyenne-generale .label { color: #334155; }
          }
          th { background: #f1f5f9; }
          .centre { text-align: center; }
          .moyenne-generale { background: #0f172a; color: white; border-radius: 8px; padding: 16px 20px; }
          .moyenne-generale .label { font-size: 12px; color: #cbd5e1; }
          .moyenne-generale .valeur { font-size: 24px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${lycee ? "Bulletin de notes — Lycée" : "Bulletin scolaire"}</h1>
        <div class="etablissement">${echapper(input.etablissementNom)}</div>
        <div class="identite">
          <strong>${echapper(input.elevePrenom)} ${echapper(input.eleveNom)}</strong><br />
          ${identiteClasse}
        </div>
        <table${lycee ? ' class="lycee"' : ""}>
          <thead>
            <tr>
              <th>Matière</th>
              ${lycee ? '<th class="centre">Devoir 1</th><th class="centre">Devoir 2</th><th class="centre">Devoir départemental</th><th class="centre">Moy. des devoirs</th><th class="centre">Composition</th>' : ""}
              <th class="centre">Coefficient</th>
              <th class="centre">Moyenne</th>
              ${lycee ? '<th class="centre">Points</th>' : ""}
            </tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
        </table>
        <div class="moyenne-generale">
          <div class="label">Moyenne générale</div>
          <div class="valeur">${formatMoyenne(moyenne)}</div>
        </div>
        ${lycee ? '<p class="visa">Visa de la direction</p>' : ""}
      </body>
    </html>
  `;
}
