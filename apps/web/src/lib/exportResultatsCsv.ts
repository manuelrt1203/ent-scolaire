import Papa from "papaparse";
import { moyenneBulletin, type BulletinHtmlInput } from "@ent/shared";

export function construireResultatsCsv(
  bulletins: readonly BulletinHtmlInput[],
  classe: string,
  periode: string,
) {
  const decimal = (valeur: number | null) => valeur == null ? "" : valeur.toFixed(2).replace(".", ",");
  const lignes = bulletins.flatMap((bulletin) => {
    const moyenne = decimal(moyenneBulletin(bulletin.lignes));
    return bulletin.lignes.flatMap((ligne) => ligne.moyenne == null ? [] : [[
      classe,
      periode,
      bulletin.eleveNom,
      bulletin.elevePrenom,
      ligne.matiere ?? "",
      decimal(ligne.coefficient),
      decimal(ligne.moyenne),
      moyenne,
    ]]);
  });

  return "\ufeff" + Papa.unparse({
    fields: ["Classe", "Période", "Nom", "Prénom", "Matière", "Coefficient", "Moyenne matière sur 20", "Moyenne générale publiée sur 20"],
    data: lignes,
  }, { delimiter: ";", escapeFormulae: /^[\s\u0000]*[=+\-@]|^[\t\r\n]/ });
}
