import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useBoiteReception, useSupprimerDeReception } from "@ent/shared";
import { MessagerieTabs } from "../../MessagerieTabs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function InboxScreen({ basePath }: { basePath: string }) {
  const { client } = useAuth();
  const router = useRouter();
  const inboxQuery = useBoiteReception(client);
  const supprimer = useSupprimerDeReception(client);

  return (
    <View className="flex-1 bg-slate-50">
      <MessagerieTabs basePath={basePath} />
      <ScrollView className="flex-1 px-4 py-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-900">Boîte de réception</Text>
        <Pressable
          onPress={() => router.push(`${basePath}/nouveau` as never)}
          className="rounded-md bg-slate-900 px-3 py-2"
        >
          <Text className="text-xs font-medium text-white">Nouveau</Text>
        </Pressable>
      </View>

      {inboxQuery.data?.map((row: any) => (
        <Pressable
          key={row.id}
          onPress={() => router.push(`${basePath}/${row.messages.id}` as never)}
          className={`mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-4 py-3 ${row.lu ? "bg-white" : "bg-blue-50"}`}
        >
          <View className="flex-1">
            <Text className={`text-sm ${row.lu ? "text-slate-600" : "font-semibold text-slate-900"}`}>
              {row.messages.expediteur?.prenom} {row.messages.expediteur?.nom}
            </Text>
            <Text className={`text-sm ${row.lu ? "text-slate-500" : "text-slate-800"}`}>{row.messages.sujet}</Text>
          </View>
          <View className="items-end">
            <Text className="mb-1 text-xs text-slate-400">{formatDate(row.messages.created_at)}</Text>
            <Pressable onPress={() => supprimer.mutate(row.id)}>
              <Text className="text-xs text-slate-400">Supprimer</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}

      {inboxQuery.data?.length === 0 && (
        <Text className="mt-8 text-center text-sm text-slate-400">Boîte de réception vide.</Text>
      )}
      </ScrollView>
    </View>
  );
}
