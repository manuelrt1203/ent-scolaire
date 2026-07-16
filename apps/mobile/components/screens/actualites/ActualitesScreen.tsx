import { FlatList, Text, View } from "react-native";
import { useAuth, useActualites } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ActualitesScreen() {
  const { client } = useAuth();
  const actualitesQuery = useActualites(client);

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={actualitesQuery.data ?? []}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Actualités</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucune actualité pour le moment.</Text>}
      renderItem={({ item: a }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Text className="mb-1 text-sm font-medium text-slate-900">{a.titre}</Text>
          <Text className="mb-2 text-xs text-slate-400">{formatDate(a.created_at)}</Text>
          <Text className="text-sm text-slate-700">{a.contenu}</Text>
        </View>
      )}
    />
  );
}
