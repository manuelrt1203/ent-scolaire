import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useMessagesEnvoyes, useSupprimerMessageEnvoye } from "@ent/shared";
import { MessagerieTabs } from "../../MessagerieTabs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function SentScreen({ basePath }: { basePath: string }) {
  const { client } = useAuth();
  const router = useRouter();
  const sentQuery = useMessagesEnvoyes(client);
  const supprimer = useSupprimerMessageEnvoye(client);

  return (
    <View className="flex-1 bg-slate-50">
      <MessagerieTabs basePath={basePath} />
      <ScrollView className="flex-1 px-4 py-4">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Messages envoyés</Text>

        {sentQuery.data?.map((m: any) => (
          <View key={m.id} className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <Pressable onPress={() => router.push(`${basePath}/${m.id}` as never)}>
              <Text className="mb-1 text-xs text-slate-500">
                À : {m.message_destinataires.map((d: any) => `${d.profiles?.prenom} ${d.profiles?.nom}`).join(", ")}
              </Text>
              <Text className="text-sm font-medium text-slate-900">{m.sujet}</Text>
              <Text className="mt-1 text-xs text-slate-400">{formatDate(m.created_at)}</Text>
            </Pressable>
            <Pressable onPress={() => supprimer.mutate(m.id)} className="mt-2 self-start">
              <Text className="text-xs text-slate-400">Supprimer</Text>
            </Pressable>
          </View>
        ))}

        {sentQuery.data?.length === 0 && (
          <Text className="mt-8 text-center text-sm text-slate-400">Aucun message envoyé.</Text>
        )}
      </ScrollView>
    </View>
  );
}
