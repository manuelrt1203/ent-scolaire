import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import { getCreneaux, createCreneau, deleteCreneau, updateCreneau } from "../api/emploiDuTemps";

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
