import { useQuery } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { Profile } from "../api/auth";
import { getEtablissement } from "../api/structure";
import { fuseauCalendrier, lirePaysCalendrier, reglagesPays } from "../domain/calendrierLocal";
import { getDatesOfficielles } from "../api/calendrierOfficiel";

export function useEtablissementCalendrier(client: EntSupabaseClient, profile: Profile | null) {
  // Même clé que l'écran Paramètres : un changement d'académie invalide les deux
  const etablissementQuery = useQuery({
    queryKey: ["etablissement", profile?.etablissement_id],
    queryFn: () => getEtablissement(client, profile!.etablissement_id),
    enabled: Boolean(profile?.etablissement_id),
  });
  const pays = lirePaysCalendrier(etablissementQuery.data?.pays_calendrier);
  return { pays, fuseau: fuseauCalendrier(pays, etablissementQuery.data?.fuseau_calendrier), reglages: reglagesPays(pays), academie: etablissementQuery.data?.academie ?? null, charge: etablissementQuery.isSuccess } as const;
}

/** Les dates officielles sont chargées pour les établissements en France. */
export function useDatesOfficielles(client: EntSupabaseClient, profile: Profile | null) {
  const { pays, reglages, academie, charge } = useEtablissementCalendrier(client, profile);

  const datesQuery = useQuery({
    queryKey: ["dates-officielles", pays, academie, profile?.role ?? null],
    queryFn: () => getDatesOfficielles(academie, profile?.role),
    enabled: charge && reglages.calendrierOfficielFrance,
    staleTime: 24 * 3600_000,
    retry: 1,
  });

  return { ...datesQuery, academie, academieChargee: charge, calendrierOfficielFrance: reglages.calendrierOfficielFrance };
}
