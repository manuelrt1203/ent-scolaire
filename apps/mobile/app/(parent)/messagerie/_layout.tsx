import { View } from "react-native";
import { Stack } from "expo-router";
import { TopNav } from "../../../components/TopNav";

export default function ParentMessagerieLayout() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(parent)" messagerieHref="/(parent)/messagerie" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
