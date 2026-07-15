import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getUtilisateurs, useEnvoyerMessage } from "@ent/shared";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export function ComposeScreen({ basePath }: { basePath: string }) {
  const { client, profile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ destinataireId?: string; sujet?: string }>();

  const usersQuery = useQuery({ queryKey: ["utilisateurs"], queryFn: () => getUtilisateurs(client) });
  const envoyer = useEnvoyerMessage(client);

  const [destinataires, setDestinataires] = useState<string[]>(params.destinataireId ? [params.destinataireId] : []);
  const [sujet, setSujet] = useState(params.sujet ?? "");
  const [corps, setCorps] = useState("");
  const [error, setError] = useState<string | null>(null);

  const autresUtilisateurs = usersQuery.data?.filter((u) => u.id !== profile?.id) ?? [];

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
      await envoyer.mutateAsync({ sujet, corps, destinataireIds: destinataires });
      router.replace(`${basePath}/envoyes` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 py-4">
      <SafeAreaView edges={["top"]} />
      <Text className="mb-4 text-lg font-semibold text-slate-900">Nouveau message</Text>

      <Text className="mb-1 text-xs font-medium text-slate-600">Destinataires</Text>
      <View className="mb-4 max-h-48 rounded-md border border-slate-300 bg-white p-2">
        <ScrollView>
          {autresUtilisateurs.map((u) => {
            const selected = destinataires.includes(u.id);
            return (
              <Pressable
                key={u.id}
                onPress={() => toggleDestinataire(u.id)}
                className={`mb-1 rounded px-2 py-2 ${selected ? "bg-slate-900" : "bg-slate-50"}`}
              >
                <Text className={`text-sm ${selected ? "text-white" : "text-slate-700"}`}>
                  {u.prenom} {u.nom} ({ROLE_LABELS[u.role]})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
