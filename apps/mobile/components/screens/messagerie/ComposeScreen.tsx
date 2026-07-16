import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie, useEnvoyerMessage } from "@ent/shared";

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

  const [destinataires, setDestinataires] = useState<string[]>(params.destinataireId ? [params.destinataireId] : []);
  const [sujet, setSujet] = useState(params.sujet ?? "");
  const [corps, setCorps] = useState("");
  const [error, setError] = useState<string | null>(null);

  const autresUtilisateurs = usersQuery.data ?? [];

  function toggleDestinataire(id: string) {
    setDestinataires((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setError(null);
    if (destinataires.length === 0) {
      setError("Sélectionnez au moins un destinataire");
      return;
    }
    try {
      await envoyer.mutateAsync({ sujet, corps, destinataireIds: destinataires, parentMessageId: params.parentMessageId });
      router.replace(`${basePath}/envoyes` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
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
                className={`mb-1 rounded px-2 py-2 ${selected ? "bg-slate-900" : "bg-slate-50"}`}
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

      {error && <Text className="mb-4 text-sm text-red-600">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={envoyer.isPending}
        className="rounded-md bg-slate-900 px-4 py-3 disabled:opacity-50"
      >
        <Text className="text-center text-sm font-medium text-white">{envoyer.isPending ? "Envoi…" : "Envoyer"}</Text>
      </Pressable>
    </ScrollView>
  );
}
