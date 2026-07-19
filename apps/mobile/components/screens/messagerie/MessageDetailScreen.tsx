import { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAuth,
  useMessageThread,
  useMarquerCommeLu,
  useSupprimerDeReception,
  useSupprimerMessageEnvoye,
} from "@ent/shared";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function MessageDetailScreen({ basePath }: { basePath: string }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, profile } = useAuth();

  const threadQuery = useMessageThread(client, id ?? null);
  const marquerLu = useMarquerCommeLu(client);
  const supprimer = useSupprimerDeReception(client);
  const supprimerEnvoye = useSupprimerMessageEnvoye(client);

  const thread = threadQuery.data ?? [];
  const mesLignesNonLues = thread
    .map((m: any) => m.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id))
    .filter((row: any) => row && !row.lu);
  const cleNonLues = mesLignesNonLues.map((r: any) => r.id).join(",");

  useEffect(() => {
    mesLignesNonLues.forEach((row: any) => marquerLu.mutate(row.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleNonLues]);

  if (thread.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-sm text-slate-500">Chargement…</Text>
      </View>
    );
  }

  const root = thread[0];
  const dernierAutre = [...thread].reverse().find((m: any) => m.expediteur_id !== profile?.id);
  const destinataireReponse = dernierAutre?.expediteur_id ?? root.message_destinataires?.[0]?.destinataire_id;

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 py-4" contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={["top"]} />
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-xs text-slate-500">← Retour</Text>
      </Pressable>

      <Text className="mb-4 text-lg font-semibold text-slate-900">{root.sujet}</Text>

      <View className="mb-6" style={{ gap: 12 }}>
        {thread.map((m: any) => {
          const estMoi = m.expediteur_id === profile?.id;
          const mesDestinataires = m.message_destinataires ?? [];
          return (
            <View
              key={m.id}
              className={`rounded-lg border border-slate-200 p-4 ${estMoi ? "bg-slate-50" : "bg-white"}`}
            >
              <View className="mb-2 flex-row items-baseline justify-between">
                <Text className="text-sm font-medium text-slate-900">
                  {estMoi ? "Vous" : `${m.expediteur?.prenom} ${m.expediteur?.nom}`}{" "}
                  <Text className="text-xs font-normal text-slate-400">({ROLE_LABELS[m.expediteur?.role]})</Text>
                </Text>
              </View>
              <Text className="mb-2 text-xs text-slate-400">
                {new Date(m.created_at).toLocaleString("fr-FR")}
                {"\n"}
                À : {mesDestinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
              </Text>
              <Text className="text-sm text-slate-800">{m.corps}</Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: `${basePath}/nouveau` as never,
              params: {
                destinataireId: destinataireReponse,
                sujet: root.sujet.startsWith("Re: ") ? root.sujet : `Re: ${root.sujet}`,
                parentMessageId: root.id,
              },
            })
          }
          className="rounded-md bg-indigo-ink px-4 py-2"
        >
          <Text className="text-sm font-medium text-white">Répondre</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            thread.forEach((m: any) => {
              if (m.expediteur_id === profile?.id) {
                supprimerEnvoye.mutate(m.id);
                return;
              }
              const row = m.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id);
              if (row) supprimer.mutate(row.id);
            });
            router.replace(basePath as never);
          }}
          className="rounded-md border border-slate-300 px-4 py-2"
        >
          <Text className="text-sm text-slate-600">Supprimer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
