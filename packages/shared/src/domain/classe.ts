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
