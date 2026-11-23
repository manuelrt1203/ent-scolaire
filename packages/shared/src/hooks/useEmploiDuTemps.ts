import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import { getCreneaux, createCreneau, deleteCreneau, updateCreneau, getExceptionsCreneaux, planifierExceptionCreneau, dateCreneauSemaine, appliquerExceptionCreneau } from "../api/emploiDuTemps";

export function useCreneaux(client: EntSupabaseClient, filter?: { matiereClasseId?: string; classeId?: string }, enabled = true) {
  return useQuery({
    queryKey: ["creneaux", filter?.matiereClasseId ?? null, filter?.classeId ?? null],
    queryFn: () => getCreneaux(client, filter),
    enabled,
  });
}

export function useCreateCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneau: TablesInsert<"creneaux">) => createCreneau(client, creneau),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creneaux"] });
      queryClient.invalidateQueries({ queryKey: ["suivi-appels-classe"] });
    },
  });
}

export function useUpdateCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, creneau }: { id: string; creneau: TablesInsert<"creneaux"> }) => updateCreneau(client, id, creneau),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creneaux"] });
      queryClient.invalidateQueries({ queryKey: ["suivi-appels-classe"] });
    },
  });
}

export function useDeleteCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneauId: string) => deleteCreneau(client, creneauId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creneaux"] });
      queryClient.invalidateQueries({ queryKey: ["suivi-appels-classe"] });
    },
  });
}

export function useExceptionsCreneaux(client: EntSupabaseClient, ids: string[], debut: string, fin = debut) {
  return useQuery({
    queryKey: ["exceptions-creneaux", ids, debut, fin],
    queryFn: () => getExceptionsCreneaux(client, ids, debut, fin),
    enabled: Boolean(debut && ids.length),
  });
}

export function usePlanningSemaine<T extends Awaited<ReturnType<typeof getCreneaux>>[number]>(
  client: EntSupabaseClient, creneaux: T[], lundi: string,
) {
  const exceptions = useExceptionsCreneaux(client, creneaux.map(({ id }) => id), lundi, dateCreneauSemaine(lundi, 6));
  const parCreneau = new Map(exceptions.data?.map((exception) => [exception.creneau_id, exception]));
  const seances = creneaux.map((creneau) => {
    const exception = parCreneau.get(creneau.id);
    return {
      ...appliquerExceptionCreneau(creneau, exception),
      date: dateCreneauSemaine(lundi, creneau.jour_semaine),
      annule: Boolean(exception?.annule),
      modifie: Boolean(exception && !exception.annule),
    };
  }).sort((a, b) => a.jour_semaine - b.jour_semaine || a.heure_debut.localeCompare(b.heure_debut));

  return { seances, isPending: creneaux.length > 0 && exceptions.isPending, isError: exceptions.isError };
}

export function usePlanifierExceptionCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changement: Parameters<typeof planifierExceptionCreneau>[1]) => planifierExceptionCreneau(client, changement),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["exceptions-creneaux"] }),
      queryClient.invalidateQueries({ queryKey: ["suivi-appels-classe"] }),
      queryClient.invalidateQueries({ queryKey: ["appel-seance"] }),
    ]),
  });
}
