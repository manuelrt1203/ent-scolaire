import { useQuery } from "@tanstack/react-query";
import { SectionList, Text, View } from "react-native";
import { useAuth, getAnnuaireMessagerie } from "@ent/shared";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeurs",
  eleve: "Élèves",
  parent: "Parents",
};

const ROLE_ORDER = ["direction", "professeur", "eleve", "parent"];

export function AnnuaireScreen() {
  const { client } = useAuth();
  const annuaireQuery = useQuery({ queryKey: ["annuaire"], queryFn: () => getAnnuaireMessagerie(client) });

  const parRole = (annuaireQuery.data ?? []).reduce<Record<string, any[]>>((acc, p: any) => {
    (acc[p.role] ??= []).push(p);
    return acc;
  }, {});

  const sections = ROLE_ORDER.filter((role) => (parRole[role]?.length ?? 0) > 0).map((role) => ({
    title: ROLE_LABELS[role],
    data: parRole[role],
  }));

  return (
    <SectionList
      className="flex-1 bg-slate-50 px-4 py-4"
      sections={sections}
      keyExtractor={(p: any) => p.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Annuaire</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Annuaire vide.</Text>}
      renderSectionHeader={({ section }) => (
        <Text className="mb-2 mt-2 text-xs font-medium uppercase text-slate-500">{section.title}</Text>
      )}
      renderItem={({ item: p }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Text className="text-sm font-medium text-slate-900">{p.prenom} {p.nom}</Text>
          <Text className="text-xs text-slate-500">{p.email}</Text>
        </View>
      )}
    />
  );
}
