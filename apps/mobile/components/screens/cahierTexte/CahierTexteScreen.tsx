import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { useAuth, getClasseEleve, useCahierTexteClasse } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function CahierTexteScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;

  const cahierQuery = useCahierTexteClasse(client, classeId);

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={cahierQuery.data ?? []}
      keyExtractor={(entree) => entree.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Cahier de textes</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucune entrée pour le moment.</Text>}
      renderItem={({ item: entree }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Text className="mb-1 text-sm font-medium text-slate-900">
            {formatDate(entree.date_seance)} — {entree.matiere_classe?.matieres?.nom}
          </Text>
          {entree.contenu_seance && <Text className="mb-1 text-sm text-slate-700">{entree.contenu_seance}</Text>}
          {entree.travail_a_faire && (
            <Text className="text-sm text-slate-600">
              Travail à faire : {entree.travail_a_faire}
              {entree.date_echeance ? ` (pour le ${formatDate(entree.date_echeance)})` : ""}
            </Text>
          )}
        </View>
      )}
    />
  );
}
