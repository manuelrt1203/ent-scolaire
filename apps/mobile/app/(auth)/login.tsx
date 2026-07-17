import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@ent/shared";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <Text className="mb-6 text-xl font-semibold text-slate-900">ENT Scolaire</Text>

        <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <Text className="mb-1 text-sm font-medium text-slate-700">Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        {error && <Text className="mb-4 text-sm text-red-600">{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="rounded-md bg-slate-900 px-3 py-3 disabled:opacity-50"
        >
          <Text className="text-center text-sm font-medium text-white">
            {loading ? "Connexion…" : "Se connecter"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/activation")} className="mt-3">
          <Text className="text-center text-xs text-slate-500">Première connexion ? Activer mon compte</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/invitation")} className="mt-2">
          <Text className="text-center text-xs text-slate-500">J'ai un code d'invitation</Text>
        </Pressable>
      </View>
    </View>
  );
}
