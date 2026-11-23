import type { getDetailsBulletin } from "../api/notes";
import type { Tables } from "../types/database.types";
import { CYCLE_LABELS, libelleClasse } from "./classe";
import { formatMoyenne } from "./moyenne";

export interface BulletinHtmlInput {
  etablissementNom: string;
  eleveNom: string;
  elevePrenom: string;
  decisionConseil?: string | null;
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

export function moyenneBulletin(lignes: readonly Tables<"v_bulletin">[]): number | null {
  // L'export reflète les seules disciplines publiées qu'il contient.
  const { points, coefficients } = lignes.reduce((total, ligne) => {
    if (ligne.moyenne != null && ligne.coefficient != null) {
      const coefficient = Math.round(ligne.coefficient * 100);
      total.points += Math.round(ligne.moyenne * 100) * coefficient;
      total.coefficients += coefficient;
    }
    return total;
  }, { points: 0, coefficients: 0 });
  return coefficients > 0 ? Math.round(points / coefficients) / 100 : null;
}

/** Les moyennes officielles sont lues dans le relevé publié. */
function buildBulletinSection(input: BulletinHtmlInput): string {
  const matieresPubliees = new Set(input.lignes.map(({ matiere_classe_id }) => matiere_classe_id));
  const detailsPublies = input.details.filter(({ releves_notes }) =>
    releves_notes?.matiere_classe_id && matieresPubliees.has(releves_notes.matiere_classe_id)
  );
  const classes = new Map(
    detailsPublies.flatMap(({ releves_notes }) => {
      const classe = releves_notes?.matiere_classe?.classes;
      return classe ? [[classe.id, classe] as const] : [];
    }),
  );
  const classe = classes.size === 1 ? [...classes.values()][0] : undefined;
  const evaluations = new Map<string, BulletinHtmlInput["details"]>();
  for (const detail of detailsPublies) {
    const id = detail.releves_notes?.matiere_classe_id;
    if (!id || ![detail.devoir_1, detail.devoir_2, detail.devoir_departemental, detail.composition].some((note) => note != null)) continue;
    const notes = evaluations.get(id) ?? [];
    notes.push(detail);
    evaluations.set(id, notes);
  }
  const lycee = classe ? classe.cycle === "lycee" : evaluations.size > 0;
  const cycle = classe?.cycle ? CYCLE_LABELS[classe.cycle] : lycee ? CYCLE_LABELS.lycee : null;
  const identiteClasse = [
    libelleClasse(classe),
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

  const moyenne = moyenneBulletin(input.lignes);

  return `
      <article class="bulletin">
        <h1>Bulletin scolaire${cycle ? ` — ${cycle}` : ""}</h1>
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
          <div class="label">Moyenne des matières publiées</div>
          <div class="valeur">${formatMoyenne(moyenne)}</div>
        </div>
        ${input.decisionConseil ? `<section class="decision">
          <h2>Décision du conseil de classe</h2>
          <p>${echapper(input.decisionConseil)}</p>
        </section>` : ""}
        ${lycee ? '<p class="visa">Visa de la direction</p>' : ""}
      </article>`;
}

export function buildBulletinsHtml(bulletins: readonly BulletinHtmlInput[]): string {
  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${bulletins.length === 1 ? "Bulletin scolaire" : "Bulletins scolaires"}</title>
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
          .decision { margin-top: 18px; break-inside: avoid; }
          .decision h2 { font-size: 14px; }
          .decision p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; }
          .visa { margin-top: 24px; text-align: right; font-size: 13px; }
          th { background: #f1f5f9; }
          .centre { text-align: center; }
          .moyenne-generale { background: #0f172a; color: white; border-radius: 8px; padding: 16px 20px; }
          .moyenne-generale .label { font-size: 12px; color: #cbd5e1; }
          .moyenne-generale .valeur { font-size: 24px; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .bulletin + .bulletin { break-before: page; page-break-before: always; }
            .moyenne-generale { background: white; color: #0f172a; border: 1px solid #cbd5e1; }
            .moyenne-generale .label { color: #334155; }
          }
        </style>
      </head>
      <body>
        ${bulletins.map(buildBulletinSection).join("\n")}
      </body>
    </html>
  `;
}

export function buildBulletinHtml(input: BulletinHtmlInput): string {
  return buildBulletinsHtml([input]);
}
