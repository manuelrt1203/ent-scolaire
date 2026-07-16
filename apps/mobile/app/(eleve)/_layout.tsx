import { Stack, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@ent/shared";
import { TopNav } from "../../components/TopNav";
import { ViewedEleveProvider } from "../../lib/ViewedEleveContext";

export default function EleveLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.role !== "eleve") return <Redirect href="/" />;

  return (
    <ViewedEleveProvider eleveId={profile?.id ?? null}>
      <View className="flex-1">
        <TopNav basePath="/(eleve)" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ViewedEleveProvider>
  );
}
