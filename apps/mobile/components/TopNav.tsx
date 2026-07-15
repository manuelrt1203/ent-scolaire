import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@ent/shared";

export function TopNav({ notesHref, messagerieHref }: { notesHref: string; messagerieHref: string }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <SafeAreaView edges={["top"]} className="border-b border-slate-200 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row gap-4">
          <Pressable onPress={() => router.push(notesHref as never)}>
            <Text className="text-sm font-medium text-slate-700">Notes</Text>
          </Pressable>
          <Pressable onPress={() => router.push(messagerieHref as never)}>
            <Text className="text-sm font-medium text-slate-700">Messagerie</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-slate-400">{profile?.prenom}</Text>
          <Pressable onPress={handleSignOut}>
            <Text className="text-xs text-slate-400">Déconnexion</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
