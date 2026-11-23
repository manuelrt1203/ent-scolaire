import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { TablesInsert } from "../types/database.types";
import {
  getVieScolaireEleve,
  getVieScolaireClasse,
  createEvenementVieScolaire,
  justifierEvenement,
  examinerJustificatif,
  deleteEvenementVieScolaire,
  uploaderJustificatifAbsence,
} from "../api/vieScolaire";

export function useVieScolaireEleve(client: EntSupabaseClient, eleveId: string | null) {
  return useQuery({
    queryKey: ["vie-scolaire-eleve", eleveId],
    queryFn: () => getVieScolaireEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
}

export function useVieScolaireClasse(client: EntSupabaseClient, classeId: string | null) {
  return useQuery({
    queryKey: ["vie-scolaire-classe", classeId],
    queryFn: () => getVieScolaireClasse(client, classeId as string),
    enabled: Boolean(classeId),
  });
}

export function useCreateEvenementVieScolaire(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evenement: TablesInsert<"vie_scolaire_evenements">) => createEvenementVieScolaire(client, evenement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] });
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] });
    },
  });
}

export function useJustifierEvenement(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, justifie, motif }: { id: string; justifie: boolean; motif?: string }) =>
      justifierEvenement(client, id, justifie, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] });
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] });
    },
  });
}

export function useExaminerJustificatif(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decision: Parameters<typeof examinerJustificatif>[1]) => examinerJustificatif(client, decision),
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] }),
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] }),
    ]),
  });
}

export function useUploaderJustificatifAbsence(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vieScolaireId, file }: { vieScolaireId: string; file: File | Blob }) =>
      uploaderJustificatifAbsence(client, vieScolaireId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] });
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] });
    },
  });
}

export function useDeleteEvenementVieScolaire(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvenementVieScolaire(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-eleve"] });
      queryClient.invalidateQueries({ queryKey: ["vie-scolaire-classe"] });
    },
  });
}
