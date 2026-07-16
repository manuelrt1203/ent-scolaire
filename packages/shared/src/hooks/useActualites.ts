import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import { getActualites, createActualite, deleteActualite } from "../api/actualites";

export function useActualites(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["actualites"], queryFn: () => getActualites(client) });
}

export function useCreateActualite(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actualite: TablesInsert<"actualites">) => createActualite(client, actualite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actualites"] });
    },
  });
}

export function useDeleteActualite(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActualite(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actualites"] });
    },
  });
}
