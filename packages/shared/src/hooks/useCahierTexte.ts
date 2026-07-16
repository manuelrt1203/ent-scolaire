import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert, TablesUpdate } from "../types/database.types";
import {
  getCahierTexteMatiereClasse,
  getCahierTexteClasse,
  createEntreeCahierTexte,
  updateEntreeCahierTexte,
  deleteEntreeCahierTexte,
} from "../api/cahierTexte";

export function useCahierTexteMatiereClasse(client: EntSupabaseClient, matiereClasseId: string | null) {
  return useQuery({
    queryKey: ["cahier-texte-matiere-classe", matiereClasseId],
    queryFn: () => getCahierTexteMatiereClasse(client, matiereClasseId as string),
    enabled: Boolean(matiereClasseId),
  });
}

export function useCahierTexteClasse(client: EntSupabaseClient, classeId: string | null) {
  return useQuery({
    queryKey: ["cahier-texte-classe", classeId],
    queryFn: () => getCahierTexteClasse(client, classeId as string),
    enabled: Boolean(classeId),
  });
}

export function useCreateEntreeCahierTexte(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entree: TablesInsert<"cahier_texte">) => createEntreeCahierTexte(client, entree),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-matiere-classe"] });
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-classe"] });
    },
  });
}

export function useUpdateEntreeCahierTexte(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entree }: { id: string; entree: TablesUpdate<"cahier_texte"> }) =>
      updateEntreeCahierTexte(client, id, entree),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-matiere-classe"] });
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-classe"] });
    },
  });
}

export function useDeleteEntreeCahierTexte(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntreeCahierTexte(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-matiere-classe"] });
      queryClient.invalidateQueries({ queryKey: ["cahier-texte-classe"] });
    },
  });
}
