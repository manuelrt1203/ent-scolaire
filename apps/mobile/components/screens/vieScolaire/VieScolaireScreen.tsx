import { FlatList, Text, View } from "react-native";
import { useAuth, useVieScolaireEleve } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

const TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  sanction: "Sanction",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();
  const vieScolaireQuery = useVieScolaireEleve(client, eleveId);

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={vieScolaireQuery.data ?? []}
      keyExtractor={(v) => v.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Vie scolaire</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucun événement de vie scolaire.</Text>}
      renderItem={({ item: v }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-slate-900">{TYPE_LABELS[v.type]}</Text>
            <Text className="text-xs text-slate-400">{formatDate(v.date)}</Text>
          </View>
          {v.type === "sanction" && v.description && <Text className="text-sm text-slate-700">{v.description}</Text>}
          {v.type === "retard" && v.duree_minutes != null && <Text className="text-sm text-slate-700">{v.duree_minutes} min</Text>}
          {v.type !== "sanction" && (
            <Text className={`mt-1 text-xs ${v.justifie ? "text-emerald-600" : "text-amber-600"}`}>
              {v.justifie ? "Justifié" : v.justificatif_motif_refus ? "Justificatif refusé" : v.justificatif_chemin ? "Justificatif en attente de validation" : "À justifier"}
              {v.justificatif_motif_refus ? ` · ${v.justificatif_motif_refus}` : ""}
              {v.motif ? ` · ${v.motif}` : ""}
            </Text>
          )}
        </View>
      )}
    />
  );
}
