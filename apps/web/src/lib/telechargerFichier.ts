/** Déclenche le téléchargement d'un contenu texte dans le navigateur —
 * spécifique au web (Blob/URL/DOM), contrairement à buildEmploiDuTempsIcs
 * qui reste pur dans @ent/shared et fonctionne aussi côté mobile. */
export function telechargerFichierTexte(contenu: string, nomFichier: string, type: string) {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
