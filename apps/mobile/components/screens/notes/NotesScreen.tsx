import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, usePeriodes, useBulletin, useMoyenneGenerale, formatMoyenne } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

export function NotesScreen() {
  const { client } = useAuth();
  const router = useRouter();
  const eleveId = useViewedEleveId();

  const periodesQuery = usePeriodes(client);
  const [periodeId, setPeriodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!periodeId && periodesQuery.data && periodesQuery.data.length > 0) {
      const active = periodesQuery.data[periodesQuery.data.length - 1];
      setPeriodeId(active.id);
    }
  }, [periodesQuery.data, periodeId]);

  const bulletinQuery = useBulletin(client, eleveId, periodeId);
  const moyenneGeneraleQuery = useMoyenneGenerale(client, eleveId, periodeId);

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="h-16 flex-none border-b border-slate-200 bg-white"
        contentContainerClassName="flex-row items-center px-4"
      >
        {periodesQuery.data?.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPeriodeId(p.id)}
            className={`mr-2 self-center rounded-full px-3 py-1.5 ${p.id === periodeId ? "bg-slate-900" : "bg-slate-100"}`}
          >
            <Text className={`text-sm ${p.id === periodeId ? "text-white" : "text-slate-600"}`}>{p.nom}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 py-4">
        <View className="mb-4 rounded-xl bg-slate-900 p-5">
          <Text className="text-sm text-slate-300">Moyenne générale</Text>
          <Text className="text-3xl font-semibold text-white">{formatMoyenne(moyenneGeneraleQuery.data ?? null)}</Text>
        </View>

        {bulletinQuery.data?.map((ligne) => (
          <Pressable
            key={ligne.matiere_classe_id}
            onPress={() => router.push({ pathname: "./matiere/[matiereClasseId]", params: { matiereClasseId: ligne.matiere_classe_id!, periodeId: periodeId! } })}
            className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <View>
              <Text className="text-sm font-medium text-slate-900">{ligne.matiere}</Text>
              <Text className="text-xs text-slate-400">Coefficient {ligne.coefficient}</Text>
            </View>
            <Text className="text-base font-semibold text-slate-900">{formatMoyenne(ligne.moyenne)}</Text>
          </Pressable>
        ))}

        {bulletinQuery.data?.length === 0 && (
          <Text className="mt-4 text-center text-sm text-slate-400">Aucune note publiée pour cette période.</Text>
        )}
      </ScrollView>
    </View>
  );
}
