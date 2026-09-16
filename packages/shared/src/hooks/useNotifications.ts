import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import {
  getNotifications,
  getNombreNotificationsNonLues,
  marquerNotificationCommeLue,
  marquerToutesNotificationsCommeLues,
} from "../api/notifications";

/** Même pattern que useNombreNonLus (messagerie) : rafraîchi périodiquement,
 * pas de souscription Realtime. */
export function useNotifications(client: EntSupabaseClient) {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => getNotifications(client),
    refetchInterval: 30000,
  });
}

export function useNombreNotificationsNonLues(client: EntSupabaseClient) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getNombreNotificationsNonLues(client),
    refetchInterval: 30000,
  });
}

export function useMarquerNotificationCommeLue(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marquerNotificationCommeLue(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarquerToutesNotificationsCommeLues(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => marquerToutesNotificationsCommeLues(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
