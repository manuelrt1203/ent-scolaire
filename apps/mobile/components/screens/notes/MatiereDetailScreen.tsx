import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useNotesEleveMatiere } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

export function MatiereDetailScreen() {
  const { client } = useAuth();
  const router = useRouter();
  const eleveId = useViewedEleveId();
  const { matiereClasseId, periodeId } = useLocalSearchParams<{ matiereClasseId: string; periodeId: string }>();

  const notesQuery = useNotesEleveMatiere(client, eleveId, matiereClasseId ?? null, periodeId ?? null);

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={["top"]} className="border-b border-slate-200 bg-white">
        <View className="px-4 py-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-xs text-slate-500">← Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-4 py-4">
        {notesQuery.data?.map((n: any) => (
          <View key={n.id} className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <Text className="text-sm text-slate-700">{n.libelle ?? "Note"}</Text>
            <Text className="text-base font-semibold tabular-nums text-slate-900">
              {n.valeur !== null ? `${Number(n.valeur).toFixed(2)}/20` : "—"}
            </Text>
          </View>
        ))}
        {notesQuery.data?.length === 0 && (
          <Text className="mt-4 text-center text-sm text-slate-400">Aucune note publiée pour cette matière.</Text>
        )}
      </ScrollView>
    </View>
  );
}
