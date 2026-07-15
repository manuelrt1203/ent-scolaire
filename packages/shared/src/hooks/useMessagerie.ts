import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import {
  envoyerMessage,
  getBoiteReception,
  getMessagesEnvoyes,
  getMessageDetail,
  marquerCommeLu,
  supprimerDeReception,
  getNombreNonLus,
} from "../api/messagerie";

export function useBoiteReception(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["messagerie", "inbox"], queryFn: () => getBoiteReception(client) });
}

export function useMessagesEnvoyes(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["messagerie", "sent"], queryFn: () => getMessagesEnvoyes(client) });
}

export function useMessageDetail(client: EntSupabaseClient, messageId: string | null) {
  return useQuery({
    queryKey: ["messagerie", "detail", messageId],
    queryFn: () => getMessageDetail(client, messageId as string),
    enabled: Boolean(messageId),
  });
}

export function useNombreNonLus(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["messagerie", "unread-count"], queryFn: () => getNombreNonLus(client) });
}

export function useEnvoyerMessage(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sujet, corps, destinataireIds }: { sujet: string; corps: string; destinataireIds: string[] }) =>
      envoyerMessage(client, sujet, corps, destinataireIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messagerie", "sent"] });
    },
  });
}

export function useMarquerCommeLu(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (destinataireRowId: string) => marquerCommeLu(client, destinataireRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messagerie", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["messagerie", "unread-count"] });
    },
  });
}

export function useSupprimerDeReception(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (destinataireRowId: string) => supprimerDeReception(client, destinataireRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messagerie", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["messagerie", "unread-count"] });
    },
  });
}
