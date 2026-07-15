import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@ent/shared";

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">Chargement du profil…</Text>
      </View>
    );
  }

  if (profile.role === "eleve") return <Redirect href="/(eleve)" />;
  if (profile.role === "parent") return <Redirect href="/(parent)" />;

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-8">
      <Text className="text-center text-slate-500">
        Ce rôle utilise l'application de bureau, pas l'application mobile.
      </Text>
    </View>
  );
}
