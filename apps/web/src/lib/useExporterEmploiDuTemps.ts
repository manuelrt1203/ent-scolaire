import { useMutation } from "@tanstack/react-query";
import { buildEmploiDuTempsIcs, getExceptionsCreneaux, useAuth, type CreneauPourIcs } from "@ent/shared";
import { telechargerFichierTexte } from "./telechargerFichier";

export function useExporterEmploiDuTemps() {
  const { client } = useAuth();
  return useMutation({
    mutationFn: async ({ creneaux, annee }: {
      creneaux: CreneauPourIcs[];
      annee: { date_debut: string; date_fin: string };
    }) => {
      const exceptions = await getExceptionsCreneaux(
        client, creneaux.map(({ id }) => id), annee.date_debut, annee.date_fin,
      );
      const ics = buildEmploiDuTempsIcs(creneaux, annee, exceptions);
      telechargerFichierTexte(ics, "emploi-du-temps.ics", "text/calendar");
    },
  });
}
