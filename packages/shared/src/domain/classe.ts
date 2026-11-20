import type { Enums } from "../types/database.types";

export type CycleScolaire = Enums<"cycle_scolaire">;

export const CYCLE_LABELS: Record<CycleScolaire, string> = {
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

export const CYCLES_ORDRE: CycleScolaire[] = ["primaire", "college", "lycee"];

/** Doit rester synchronisé avec la contrainte classes_niveau_valide
 * (supabase/migrations, appliquée via MCP) — une même valeur ne peut être
 * insérée en base que si elle apparaît ici pour le cycle correspondant. */
export const NIVEAUX_PAR_CYCLE: Record<CycleScolaire, string[]> = {
  primaire: ["CP", "CE1", "CE2", "CM1", "CM2"],
  college: ["6ème", "5ème", "4ème", "3ème"],
  lycee: ["Seconde", "Première", "Terminale"],
};

export function libelleClasse(classe: { nom: string; niveau?: string | null; serie?: string | null } | null | undefined): string {
  if (!classe) return "";
  const { nom, niveau, serie } = classe;
  const libelle = nom.trim();
  const normaliser = (texte: string) => texte.trim().normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/^(\d+)(?:ieme|eme|e)\b/, "$1e");
  const niveauCourt = niveau?.replace(/^(\d+)(?:ième|ème)$/i, "$1e");
  const niveauNormalise = normaliser(niveauCourt ?? "");
  const nomNormalise = normaliser(libelle);
  const niveauDejaAffiche = nomNormalise === niveauNormalise
    || nomNormalise.startsWith(niveauNormalise + " ")
    || nomNormalise.startsWith(niveauNormalise + "-");
  const nomComplet = niveauCourt && !niveauDejaAffiche ? `${niveauCourt} ${libelle}`.trim() : libelle;
  return serie && !normaliser(nomComplet).split(/[\s-]+/).includes(normaliser(serie))
    ? `${nomComplet} · série ${serie}`
    : nomComplet;
}
