import { useQuery } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { Profile } from "../api/auth";
import { getEtablissement } from "../api/structure";
import { getDatesOfficielles } from "../api/calendrierOfficiel";

/** Vacances scolaires (académie de l'établissement) + jours fériés à venir.
 * Données publiques qui changent une fois par an : cache d'une journée, et une
 * seule nouvelle tentative si l'API est injoignable (le calendrier s'affiche quand même). */
export function useDatesOfficielles(client: EntSupabaseClient, profile: Profile | null) {
  // Même clé que l'écran Paramètres : un changement d'académie invalide les deux
  const etablissementQuery = useQuery({
    queryKey: ["etablissement", profile?.etablissement_id],
    queryFn: () => getEtablissement(client, profile!.etablissement_id),
    enabled: Boolean(profile?.etablissement_id),
  });
  const academie = etablissementQuery.data?.academie ?? null;

  const datesQuery = useQuery({
    queryKey: ["dates-officielles", academie, profile?.role ?? null],
    queryFn: () => getDatesOfficielles(academie, profile?.role),
    enabled: etablissementQuery.isSuccess,
    staleTime: 24 * 3600_000,
    retry: 1,
  });

  return { ...datesQuery, academie, academieChargee: etablissementQuery.isSuccess };
}
