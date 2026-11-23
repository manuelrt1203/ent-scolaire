import { useRef, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";
import { getJustificatifSignedUrl, libelleSeanceVieScolaire, TYPES_MIME_JUSTIFICATIF, useAuth, useUploaderJustificatifAbsence, useVieScolaireEleve } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

const TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  sanction: "Sanction",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { timeZone: "UTC" });
}

export function VieScolaireScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();
  const vieScolaireQuery = useVieScolaireEleve(client, eleveId);

  const uploader = useUploaderJustificatifAbsence(client);
  const [envoiEnCours, setEnvoiEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ eleveId: string; texte: string; erreur: boolean } | null>(null);
  const eleveAffiche = useRef(eleveId);
  eleveAffiche.current = eleveId;

  async function ajouterJustificatif(evenementId: string) {
    if (!eleveId || envoiEnCours) return;
    setMessage(null);
    setEnvoiEnCours(evenementId);
    try {
      const resultat = await getDocumentAsync({ type: TYPES_MIME_JUSTIFICATIF, copyToCacheDirectory: true });
      if (resultat.canceled || eleveAffiche.current !== eleveId) return;
      const asset = resultat.assets[0];
      const file = asset.file ?? {
        donnees: await new File(asset.uri).arrayBuffer(),
        name: asset.name,
        type: asset.mimeType ?? "",
        uuid: randomUUID(),
      };
      if (eleveAffiche.current !== eleveId) return;
      await uploader.mutateAsync({ vieScolaireId: evenementId, file });
      setMessage({ eleveId, texte: "Justificatif envoyé. Il est en attente de validation.", erreur: false });
    } catch (error) {
      setMessage({ eleveId, texte: error instanceof Error ? error.message : "Impossible d’envoyer le justificatif.", erreur: true });
    } finally {
      setEnvoiEnCours(null);
    }
  }

  async function voirJustificatif(chemin: string) {
    if (!eleveId) return;
    setMessage(null);
    try {
      const url = await getJustificatifSignedUrl(client, chemin);
      if (eleveAffiche.current === eleveId) await Linking.openURL(url);
    } catch {
      setMessage({ eleveId, texte: "Impossible d’ouvrir le justificatif.", erreur: true });
    }
  }

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={vieScolaireQuery.data ?? []}
      keyExtractor={(v) => v.id}
      ListHeaderComponent={
        <View>
          <Text className="mb-4 text-lg font-semibold text-slate-900">Vie scolaire</Text>
          {message && message.eleveId === eleveId && (
            <Text accessibilityRole="alert" className={`mb-3 text-sm ${message.erreur ? "text-red-700" : "text-teal-800"}`}>
              {message.texte}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucun événement de vie scolaire.</Text>}
      renderItem={({ item: v }) => {
        const seance = libelleSeanceVieScolaire(v.creneau);
        return (
          <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-slate-900">{TYPE_LABELS[v.type]}</Text>
              <Text className="text-xs text-slate-400">{formatDate(v.date)}</Text>
            </View>
            {seance && <Text className="mb-1 text-sm text-slate-700">{seance}</Text>}
            {v.type === "sanction" && v.description && <Text className="text-sm text-slate-700">{v.description}</Text>}
            {v.type === "retard" && v.duree_minutes != null && <Text className="text-sm text-slate-700">{v.duree_minutes} min</Text>}
            {v.type !== "sanction" && (
              <Text className={`mt-1 text-xs ${v.justifie ? "text-emerald-600" : "text-amber-600"}`}>
                {v.justifie ? "Justifié" : v.justificatif_motif_refus ? "Justificatif refusé" : v.justificatif_chemin ? "Justificatif en attente de validation" : "À justifier"}
                {v.justificatif_motif_refus ? ` · ${v.justificatif_motif_refus}` : ""}
                {v.motif ? ` · ${v.motif}` : ""}
              </Text>
            )}
            {v.type !== "sanction" && v.justificatif_chemin && (
              <Pressable accessibilityRole="button" className="mt-2 self-start py-2" onPress={() => voirJustificatif(v.justificatif_chemin!)}>
                <Text className="text-sm font-semibold text-teal-800">Voir le justificatif</Text>
              </Pressable>
            )}
            {v.type !== "sanction" && !v.justifie && (!v.justificatif_chemin || v.justificatif_motif_refus) && (
              <Pressable
                accessibilityRole="button"
                className="mt-2 self-start rounded-lg border border-teal-700 px-3 py-2"
                disabled={envoiEnCours !== null}
                onPress={() => ajouterJustificatif(v.id)}
              >
                <Text className="text-sm font-semibold text-teal-800">
                  {envoiEnCours === v.id ? "Envoi…" : v.justificatif_motif_refus ? "Remplacer le justificatif" : "Ajouter une photo ou un PDF"}
                </Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}
