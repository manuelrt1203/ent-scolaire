import { Stack, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@ent/shared";
import { ParentChildProvider, useParentChild } from "../../lib/ParentChildContext";
import { ViewedEleveProvider } from "../../lib/ViewedEleveContext";

function ParentLayoutInner() {
  const { selectedId } = useParentChild();
  return (
    <ViewedEleveProvider eleveId={selectedId}>
      <Stack screenOptions={{ headerShown: false }} />
    </ViewedEleveProvider>
  );
}

export default function ParentLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.role !== "parent") return <Redirect href="/" />;

  return (
    <ParentChildProvider>
      <ParentLayoutInner />
    </ParentChildProvider>
  );
}
