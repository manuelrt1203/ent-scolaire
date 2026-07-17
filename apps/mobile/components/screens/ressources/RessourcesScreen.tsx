import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, Text, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth, getClasseEleve, useRessourcesClasse, getRessourceSignedUrl } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatTaille(octets: number | null) {
  if (!octets) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function RessourcesScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;

  const ressourcesQuery = useRessourcesClasse(client, classeId);

  async function handleTelecharger(titre: string, cheminFichier: string) {
    const url = await getRessourceSignedUrl(client, cheminFichier);
    const extension = cheminFichier.includes(".") ? cheminFichier.slice(cheminFichier.lastIndexOf(".")) : "";
    const nomFichier = `${titre.replace(/[^\w.-]+/g, "_")}${extension}`;
    const destination = new File(Paths.cache, nomFichier);
    const fichier = await File.downloadFileAsync(url, destination, { idempotent: true });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fichier.uri);
    }
  }

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={ressourcesQuery.data ?? []}
      keyExtractor={(ressource) => ressource.id}
      ListHeaderComponent={<Text className="mb-4 text-lg font-semibold text-slate-900">Ressources pédagogiques</Text>}
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucune ressource pour le moment.</Text>}
      renderItem={({ item: ressource }: { item: any }) => (
        <View className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="mb-1 text-sm font-medium text-slate-900">
              {ressource.titre} — {ressource.matiere_classe?.matieres?.nom}
            </Text>
            <Text className="text-xs text-slate-500">
              {formatDate(ressource.created_at)}
              {ressource.taille_octets ? ` · ${formatTaille(ressource.taille_octets)}` : ""}
            </Text>
          </View>
          <Pressable onPress={() => handleTelecharger(ressource.titre, ressource.chemin_fichier)}>
            <Text className="text-sm font-medium text-slate-700">Télécharger</Text>
          </Pressable>
        </View>
      )}
    />
  );
}
