import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useNombreNonLus, useNombreNotificationsNonLues } from "@ent/shared";

export function Header({ basePath }: { basePath: string }) {
  const { client, profile, signOut } = useAuth();
  const router = useRouter();
  const nonLusQuery = useNombreNonLus(client);
  const notifications = useNombreNotificationsNonLues(client);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <SafeAreaView edges={["top"]} className="border-b border-slate-200 bg-white">
      <View className="flex-row flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Pressable onPress={() => router.push(basePath as never)} className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-md bg-indigo-ink">
            <Text className="text-xs font-bold text-white">E</Text>
          </View>
          <Text className="text-sm font-semibold text-slate-900">ENT Scolaire</Text>
          {Boolean(nonLusQuery.data) && (
            <View className="rounded-full bg-red-500 px-1.5 py-0.5">
              <Text className="text-xs font-semibold text-white">{nonLusQuery.data}</Text>
            </View>
          )}
        </Pressable>
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityRole="button" onPress={() => router.push(`${basePath}/notifications` as never)}>
            <Text className="text-xs font-semibold text-teal-800">
              Notifications{notifications.data ? ` (${notifications.data})` : ""}
            </Text>
          </Pressable>
          <Text numberOfLines={1} className="max-w-20 text-xs text-slate-400">{profile?.prenom}</Text>
          <Pressable onPress={handleSignOut}>
            <Text className="text-xs text-slate-400">Déconnexion</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
