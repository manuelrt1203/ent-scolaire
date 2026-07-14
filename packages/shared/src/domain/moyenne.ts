// Le calcul de la moyenne se fait exclusivement côté base (fonctions SQL
// calculer_moyenne_matiere / calculer_moyenne_generale) : ce module ne fait
// que formater ce que l'API renvoie, jamais de recalcul côté client.

export function formatMoyenne(moyenne: number | null): string {
  if (moyenne === null) return "—";
  return `${moyenne.toFixed(2)}/20`;
}
