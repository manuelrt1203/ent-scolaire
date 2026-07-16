import { FlatList, Text, View } from "react-native";
import { useAuth, useEvenementsCalendrier } from "@ent/shared";

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CalendrierScreen() {
  const { client } = useAuth();
  const evenementsQuery = useEvenementsCalendrier(client);

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={evenementsQuery.data ?? []}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Calendrier</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucun événement au calendrier.</Text>}
      renderItem={({ item: e }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Text className="mb-1 text-sm font-medium text-slate-900">{e.titre}</Text>
          <Text className="mb-2 text-xs text-slate-400">
            {formatDateHeure(e.date_debut)} – {formatDateHeure(e.date_fin)}
            {e.lieu ? ` · ${e.lieu}` : ""}
          </Text>
          {e.description && <Text className="text-sm text-slate-700">{e.description}</Text>}
        </View>
      )}
    />
  );
}
