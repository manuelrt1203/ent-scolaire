import type { Tables } from "../types/database.types";
import { formatMoyenne } from "./moyenne";

export interface BulletinHtmlInput {
  etablissementNom: string;
  eleveNom: string;
  elevePrenom: string;
  classeNom: string | null;
  periodeNom: string;
  lignes: Tables<"v_bulletin">[];
  moyenneGenerale: number | null;
}

function echapper(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Génère le HTML du bulletin, converti en PDF côté client (expo-print sur
 * mobile). Ne fait aucun calcul : les moyennes viennent telles quelles des
 * fonctions SQL (calculer_moyenne_matiere/generale) via v_bulletin. */
export function buildBulletinHtml(input: BulletinHtmlInput): string {
  const lignesHtml = input.lignes
    .map(
      (ligne) => `
        <tr>
          <td>${echapper(ligne.matiere ?? "")}</td>
          <td class="centre">${ligne.coefficient ?? ""}</td>
          <td class="centre">${formatMoyenne(ligne.moyenne)}</td>
        </tr>`,
    )
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .etablissement { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          .identite { margin-bottom: 20px; font-size: 13px; }
          .identite strong { font-size: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; text-align: left; }
          th { background: #f1f5f9; }
          .centre { text-align: center; }
          .moyenne-generale { background: #0f172a; color: white; border-radius: 8px; padding: 16px 20px; }
          .moyenne-generale .label { font-size: 12px; color: #cbd5e1; }
          .moyenne-generale .valeur { font-size: 24px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>Bulletin scolaire</h1>
        <div class="etablissement">${echapper(input.etablissementNom)}</div>
        <div class="identite">
          <strong>${echapper(input.elevePrenom)} ${echapper(input.eleveNom)}</strong><br />
          ${input.classeNom ? `${echapper(input.classeNom)} — ` : ""}${echapper(input.periodeNom)}
        </div>
        <table>
          <thead>
            <tr><th>Matière</th><th class="centre">Coefficient</th><th class="centre">Moyenne</th></tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
        </table>
        <div class="moyenne-generale">
          <div class="label">Moyenne générale</div>
          <div class="valeur">${formatMoyenne(input.moyenneGenerale)}</div>
        </div>
      </body>
    </html>
  `;
}
