import { View, Text, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";

export function MessagerieTabs({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // usePathname() renvoie le chemin résolu SANS les segments de groupe de
  // route (ex. "(eleve)"), donc comparer à `${basePath}/envoyes` (qui les
  // inclut) ne matchait jamais — on compare juste la fin du chemin.
  const surEnvoyes = pathname.endsWith("/envoyes");

  return (
    <View className="flex-row gap-6 border-b border-slate-200 bg-white px-4 pt-1">
      <Pressable onPress={() => router.replace(basePath as never)} className={`pb-2 ${!surEnvoyes ? "border-b-2 border-indigo-ink" : ""}`}>
        <Text className={`text-sm font-medium ${!surEnvoyes ? "text-midnight-ink" : "text-slate-500"}`}>
          Boîte de réception
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace(`${basePath}/envoyes` as never)}
        className={`pb-2 ${surEnvoyes ? "border-b-2 border-indigo-ink" : ""}`}
      >
        <Text className={`text-sm font-medium ${surEnvoyes ? "text-midnight-ink" : "text-slate-500"}`}>Envoyés</Text>
      </Pressable>
    </View>
  );
}
