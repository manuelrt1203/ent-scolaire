import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntSupabaseClient } from "../supabase/createClient";
import { getInvitations, createInvitation, deleteInvitation, type CreateInvitationInput } from "../api/invitations";

export function useInvitations(client: EntSupabaseClient) {
  return useQuery({ queryKey: ["invitations"], queryFn: () => getInvitations(client) });
}

export function useCreateInvitation(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(client, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useDeleteInvitation(client: EntSupabaseClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvitation(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}
