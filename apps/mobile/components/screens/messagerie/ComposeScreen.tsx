import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useAuth, getAnnuaireMessagerie, useEnvoyerMessage, useUploadPieceJointe } from "@ent/shared";

interface FichierChoisi {
  uri: string;
  name: string;
  mimeType: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function ComposeScreen({ basePath }: { basePath: string }) {
  const { client } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ destinataireId?: string; sujet?: string; parentMessageId?: string }>();

  const usersQuery = useQuery({ queryKey: ["annuaire-messagerie"], queryFn: () => getAnnuaireMessagerie(client) });
  const envoyer = useEnvoyerMessage(client);
  const uploadPieceJointe = useUploadPieceJointe(client);

  const [destinataires, setDestinataires] = useState<string[]>(params.destinataireId ? [params.destinataireId] : []);
  const [sujet, setSujet] = useState(params.sujet ?? "");
  const [corps, setCorps] = useState("");
  const [fichiers, setFichiers] = useState<FichierChoisi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const autresUtilisateurs = usersQuery.data ?? [];

  function toggleDestinataire(id: string) {
    setDestinataires((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleChoisirFichier() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (result.canceled) return;
    setFichiers((prev) => [
      ...prev,
      ...result.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? null })),
    ]);
  }

  function retirerFichier(uri: string) {
    setFichiers((prev) => prev.filter((f) => f.uri !== uri));
  }

  async function handleSubmit() {
    setError(null);
    if (destinataires.length === 0) {
      setError("Sélectionnez au moins un destinataire");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const messageId = await envoyer.mutateAsync({ sujet, corps, destinataireIds: destinataires, parentMessageId: params.parentMessageId });
      for (const fichier of fichiers) {
        const reponse = await fetch(fichier.uri);
        const blob = await reponse.blob();
        await uploadPieceJointe.mutateAsync({ messageId, file: blob, nomFichier: fichier.name });
      }
      router.replace(`${basePath}/envoyes` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 py-4" keyboardShouldPersistTaps="handled">
      <SafeAreaView edges={["top"]} />
      <Text className="mb-4 text-lg font-semibold text-slate-900">Nouveau message</Text>

      <Text className="mb-1 text-xs font-medium text-slate-600">
        Destinataires {destinataires.length > 0 ? `(${destinataires.length} sélectionné${destinataires.length > 1 ? "s" : ""})` : ""}
      </Text>
      <View className="mb-4 rounded-md border border-slate-300 bg-white p-2" style={{ maxHeight: 220 }}>
        <FlatList
          data={autresUtilisateurs}
          keyExtractor={(u) => u.id}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: u }) => {
            const selected = destinataires.includes(u.id);
            return (
              <Pressable
                onPress={() => toggleDestinataire(u.id)}
                className={`mb-1 rounded px-2 py-2 ${selected ? "bg-indigo-ink" : "bg-slate-50"}`}
              >
                <Text className={`text-sm ${selected ? "text-white" : "text-slate-700"}`}>
                  {u.prenom} {u.nom} ({ROLE_LABELS[u.role]})
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <Text className="mb-1 text-xs font-medium text-slate-600">Sujet</Text>
      <TextInput
        value={sujet}
        onChangeText={setSujet}
        className="mb-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      />

      <Text className="mb-1 text-xs font-medium text-slate-600">Message</Text>
      <TextInput
        value={corps}
        onChangeText={setCorps}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        className="mb-4 h-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      />

      <Text className="mb-1 text-xs font-medium text-slate-600">Pièces jointes (optionnel)</Text>
      <Pressable onPress={handleChoisirFichier} className="mb-2 rounded-md border border-slate-300 bg-white px-3 py-2">
        <Text className="text-center text-sm text-slate-700">Ajouter un fichier</Text>
      </Pressable>
      {fichiers.map((f) => (
        <View key={f.uri} className="mb-2 flex-row items-center justify-between rounded-md bg-slate-100 px-3 py-2">
          <Text className="flex-1 text-xs text-slate-700" numberOfLines={1}>
            {f.name}
          </Text>
          <Pressable onPress={() => retirerFichier(f.uri)}>
            <Text className="ml-2 text-xs text-red-600">Retirer</Text>
          </Pressable>
        </View>
      ))}

      {error && <Text className="mb-4 mt-2 text-sm text-red-600">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={envoiEnCours}
        className="mt-4 rounded-md bg-indigo-ink px-4 py-3 disabled:opacity-50"
      >
        <Text className="text-center text-sm font-medium text-white">{envoiEnCours ? "Envoi…" : "Envoyer"}</Text>
      </Pressable>
    </ScrollView>
  );
}
