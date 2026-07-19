import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useNombreNonLus } from "@ent/shared";
import { NAV } from "./nav";

export function MobileAccueilScreen({ basePath }: { basePath: string }) {
  const { client, profile } = useAuth();
  const router = useRouter();
  const nonLusQuery = useNombreNonLus(client);

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="px-4 py-4" style={{ gap: 12 }}>
      <Text className="mb-1 text-lg font-semibold text-slate-900">Bonjour {profile?.prenom}</Text>
      <Text className="mb-4 text-sm text-slate-500">Tous les espaces accessibles</Text>

      <View style={{ gap: 12 }}>
        {NAV.map((item) => {
          const badge = item.segment === "/messagerie" && Boolean(nonLusQuery.data);
          return (
            <Pressable
              key={item.segment}
              onPress={() => router.push(`${basePath}${item.segment}` as never)}
              className={`rounded-xl border p-4 active:opacity-80 ${
                item.featured ? "border-deep-violet/20 bg-periwinkle-wash" : "border-slate-200 bg-white"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className={`text-base font-semibold ${item.featured ? "text-midnight-ink" : "text-slate-900"}`}>
                  {item.label}
                </Text>
                {badge && (
                  <View className="rounded-full bg-red-500 px-2 py-0.5">
                    <Text className="text-xs font-semibold text-white">{nonLusQuery.data}</Text>
                  </View>
                )}
              </View>
              <Text className={`mt-1 text-sm ${item.featured ? "text-deep-violet" : "text-slate-500"}`}>
                {item.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
