import { View } from "react-native";
import { Stack } from "expo-router";
import { TopNav } from "../../../components/TopNav";

export default function EleveMessagerieLayout() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(eleve)" messagerieHref="/(eleve)/messagerie" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
