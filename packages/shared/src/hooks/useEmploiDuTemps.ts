import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import { getCreneaux, createCreneau, deleteCreneau } from "../api/emploiDuTemps";

export function useCreneaux(client: EntSupabaseClient, matiereClasseId?: string) {
  return useQuery({
    queryKey: ["creneaux", matiereClasseId ?? null],
    queryFn: () => getCreneaux(client, matiereClasseId),
  });
}

export function useCreateCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneau: TablesInsert<"creneaux">) => createCreneau(client, creneau),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creneaux"] });
    },
  });
}

export function useDeleteCreneau(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creneauId: string) => deleteCreneau(client, creneauId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creneaux"] });
    },
  });
}
