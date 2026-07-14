import type { Enums } from "../types/database.types";

export type StatutNote = Enums<"statut_note">;

const LABELS: Record<StatutNote, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  validee: "Validée",
  publiee: "Publiée",
};

const COLORS: Record<StatutNote, string> = {
  brouillon: "gray",
  soumise: "amber",
  validee: "blue",
  publiee: "green",
};

export function getStatutLabel(statut: StatutNote): string {
  return LABELS[statut];
}

export function getStatutColor(statut: StatutNote): string {
  return COLORS[statut];
}
