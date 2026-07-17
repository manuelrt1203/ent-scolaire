import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import {
  getRessources,
  getRessourcesClasse,
  uploadRessource,
  deleteRessource,
  type UploadRessourceInput,
} from "../api/ressources";

export function useRessources(client: EntSupabaseClient, matiereClasseId: string | null) {
  return useQuery({
    queryKey: ["ressources", matiereClasseId],
    queryFn: () => getRessources(client, matiereClasseId as string),
    enabled: Boolean(matiereClasseId),
  });
}

export function useRessourcesClasse(client: EntSupabaseClient, classeId: string | null) {
  return useQuery({
    queryKey: ["ressources-classe", classeId],
    queryFn: () => getRessourcesClasse(client, classeId as string),
    enabled: Boolean(classeId),
  });
}

export function useUploadRessource(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadRessourceInput) => uploadRessource(client, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ressources"] });
      queryClient.invalidateQueries({ queryKey: ["ressources-classe"] });
    },
  });
}

export function useDeleteRessource(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cheminFichier }: { id: string; cheminFichier: string }) =>
      deleteRessource(client, id, cheminFichier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ressources"] });
      queryClient.invalidateQueries({ queryKey: ["ressources-classe"] });
    },
  });
}
