import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import { getEvenementsCalendrier, createEvenementCalendrier, deleteEvenementCalendrier } from "../api/calendrier";

export function useEvenementsCalendrier(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["evenements-calendrier"], queryFn: () => getEvenementsCalendrier(client) });
}

export function useCreateEvenementCalendrier(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evenement: TablesInsert<"evenements_calendrier">) => createEvenementCalendrier(client, evenement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evenements-calendrier"] });
    },
  });
}

export function useDeleteEvenementCalendrier(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvenementCalendrier(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evenements-calendrier"] });
    },
  });
}
