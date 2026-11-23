export function statutJustificatif(evenement: {
  type: string;
  justifie: boolean;
  justificatif_chemin: string | null;
  justificatif_motif_refus?: string | null;
}) {
  if (evenement.type === "sanction") return null;
  if (evenement.justifie) return "justifie";
  if (evenement.justificatif_motif_refus) return "refuse";
  return evenement.justificatif_chemin ? "a_examiner" : "a_justifier";
}

export const LIBELLES_JUSTIFICATIF = {
  justifie: "Justifié",
  refuse: "Justificatif refusé",
  a_examiner: "Justificatif à examiner",
  a_justifier: "À justifier",
};
