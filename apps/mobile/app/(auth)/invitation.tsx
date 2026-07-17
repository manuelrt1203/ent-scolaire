import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, redeemInvitation } from "@ent/shared";

export default function InvitationScreen() {
  const { client } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<{ email: string } | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const result = await redeemInvitation(client, { code: code.trim().toUpperCase(), nom, prenom, email });
      setSucces({ email: result.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide");
    } finally {
      setLoading(false);
    }
  }

  if (succes) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <View className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
          <Text className="mb-4 text-xl font-semibold text-slate-900">Compte créé</Text>
          <Text className="mb-4 text-sm text-slate-600">
            Activez-le maintenant via « Première connexion » avec {succes.email} : un code vous sera envoyé par email.
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/activation")} className="rounded-md bg-slate-900 px-3 py-3">
            <Text className="text-center text-sm font-medium text-white">Activer mon compte</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <Text className="mb-1 text-xl font-semibold text-slate-900">J'ai un code d'invitation</Text>
        <Text className="mb-6 text-sm text-slate-500">Le code vous a été transmis par votre établissement.</Text>

        <Text className="mb-1 text-sm font-medium text-slate-700">Code</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest"
        />

        <Text className="mb-1 text-sm font-medium text-slate-700">Prénom</Text>
        <TextInput value={prenom} onChangeText={setPrenom} className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm" />

        <Text className="mb-1 text-sm font-medium text-slate-700">Nom</Text>
        <TextInput value={nom} onChangeText={setNom} className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm" />

        <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        {error && <Text className="mb-4 text-sm text-red-600">{error}</Text>}

        <Pressable onPress={handleSubmit} disabled={loading} className="rounded-md bg-slate-900 px-3 py-3 disabled:opacity-50">
          <Text className="text-center text-sm font-medium text-white">{loading ? "Création…" : "Créer mon compte"}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")} className="mt-3">
          <Text className="text-center text-xs text-slate-500">Retour à la connexion</Text>
        </Pressable>
      </View>
    </View>
  );
}
