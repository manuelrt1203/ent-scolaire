import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import type { ReleveNotes } from "../api/notes";
import {
  getMesAffectations,
  getReleveOrCreate,
  getReleveById,
  getNotesForReleve,
  updateNoteValeur,
  soumettreReleve,
  validerReleve,
  rejeterReleve,
  publierReleve,
  getRelevesForDirection,
  getBulletin,
  getMoyenneGenerale,
  getPeriodes,
} from "../api/notes";

export function usePeriodes(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["periodes"], queryFn: () => getPeriodes(client) });
}

export function useMesAffectations(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["mes-affectations"], queryFn: () => getMesAffectations(client) });
}

export function useReleve(client: EntSupabaseClient, matiereClasseId: string | null, periodeId: string | null) {
  return useQuery({
    queryKey: ["releve", matiereClasseId, periodeId],
    queryFn: () => getReleveOrCreate(client, matiereClasseId as string, periodeId as string),
    enabled: Boolean(matiereClasseId && periodeId),
  });
}

export function useReleveById(client: EntSupabaseClient, releveId: string | null) {
  return useQuery({
    queryKey: ["releve-by-id", releveId],
    queryFn: () => getReleveById(client, releveId as string),
    enabled: Boolean(releveId),
  });
}

export function useNotesForReleve(client: EntSupabaseClient, releveId: string | null) {
  return useQuery({
    queryKey: ["notes", releveId],
    queryFn: () => getNotesForReleve(client, releveId as string),
    enabled: Boolean(releveId),
  });
}

export function useUpdateNoteValeur(client: EntSupabaseClient, releveId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, valeur }: { noteId: string; valeur: number | null }) =>
      updateNoteValeur(client, noteId, valeur),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", releveId] });
    },
  });
}

export function useSoumettreReleve(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releveId: string) => soumettreReleve(client, releveId),
    onSuccess: (_data, releveId) => {
      queryClient.invalidateQueries({ queryKey: ["releve"] });
      queryClient.invalidateQueries({ queryKey: ["notes", releveId] });
      queryClient.invalidateQueries({ queryKey: ["releves-direction"] });
    },
  });
}

export function useValiderReleve(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ releveId, commentaire }: { releveId: string; commentaire?: string }) =>
      validerReleve(client, releveId, commentaire),
    onSuccess: (_data, { releveId }) => {
      queryClient.invalidateQueries({ queryKey: ["releves-direction"] });
      queryClient.invalidateQueries({ queryKey: ["releve-by-id", releveId] });
    },
  });
}

export function useRejeterReleve(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ releveId, commentaire }: { releveId: string; commentaire: string }) =>
      rejeterReleve(client, releveId, commentaire),
    onSuccess: (_data, { releveId }) => {
      queryClient.invalidateQueries({ queryKey: ["releves-direction"] });
      queryClient.invalidateQueries({ queryKey: ["releve-by-id", releveId] });
    },
  });
}

export function usePublierReleve(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releveId: string) => publierReleve(client, releveId),
    onSuccess: (_data, releveId) => {
      queryClient.invalidateQueries({ queryKey: ["releves-direction"] });
      queryClient.invalidateQueries({ queryKey: ["releve-by-id", releveId] });
    },
  });
}

export function useRelevesForDirection(client: EntSupabaseClient, statuts?: ReleveNotes["statut"][]) {
  return useQuery({
    queryKey: ["releves-direction", statuts],
    queryFn: () => getRelevesForDirection(client, statuts),
  });
}

export function useBulletin(client: EntSupabaseClient, eleveId: string | null, periodeId: string | null) {
  return useQuery({
    queryKey: ["bulletin", eleveId, periodeId],
    queryFn: () => getBulletin(client, eleveId as string, periodeId as string),
    enabled: Boolean(eleveId && periodeId),
  });
}

export function useMoyenneGenerale(client: EntSupabaseClient, eleveId: string | null, periodeId: string | null) {
  return useQuery({
    queryKey: ["moyenne-generale", eleveId, periodeId],
    queryFn: () => getMoyenneGenerale(client, eleveId as string, periodeId as string),
    enabled: Boolean(eleveId && periodeId),
  });
}
