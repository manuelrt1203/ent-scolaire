import { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useMessageDetail, useMarquerCommeLu, useSupprimerDeReception } from "@ent/shared";

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

  const messageQuery = useMessageDetail(client, id ?? null);
  const marquerLu = useMarquerCommeLu(client);
  const supprimer = useSupprimerDeReception(client);

  const message = messageQuery.data;
  const monDestinataireRow = message?.message_destinataires?.find((d: any) => d.destinataire_id === profile?.id);

  useEffect(() => {
    if (monDestinataireRow && !monDestinataireRow.lu) {
      marquerLu.mutate(monDestinataireRow.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monDestinataireRow?.id]);

  if (!message) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-sm text-slate-500">Chargement…</Text>
      </View>
    );
  }

  const estExpediteur = message.expediteur_id === profile?.id;

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 py-4" contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={["top"]} />
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-xs text-slate-500">← Retour</Text>
      </Pressable>

      <Text className="mb-1 text-lg font-semibold text-slate-900">{message.sujet}</Text>
      <Text className="mb-1 text-sm text-slate-600">
        De : {message.expediteur?.prenom} {message.expediteur?.nom} ({ROLE_LABELS[message.expediteur?.role]})
      </Text>
      <Text className="mb-4 text-xs text-slate-400">
        À : {message.message_destinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
        {"\n"}
        {new Date(message.created_at).toLocaleString("fr-FR")}
      </Text>

      <View className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <Text className="text-sm text-slate-800">{message.corps}</Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: `${basePath}/nouveau` as never,
              params: {
                destinataireId: estExpediteur ? undefined : message.expediteur_id,
                sujet: message.sujet.startsWith("Re: ") ? message.sujet : `Re: ${message.sujet}`,
              },
            })
          }
          className="rounded-md bg-slate-900 px-4 py-2"
        >
          <Text className="text-sm font-medium text-white">Répondre</Text>
        </Pressable>
        {!estExpediteur && monDestinataireRow && (
          <Pressable
            onPress={() => {
              supprimer.mutate(monDestinataireRow.id);
              router.replace(basePath as never);
            }}
            className="rounded-md border border-slate-300 px-4 py-2"
          >
            <Text className="text-sm text-slate-600">Supprimer</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
