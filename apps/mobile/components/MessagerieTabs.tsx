import { View, Text, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";

export function MessagerieTabs({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const surEnvoyes = pathname === `${basePath}/envoyes`;

  return (
    <View className="flex-row gap-6 border-b border-slate-200 bg-white px-4 pt-1">
      <Pressable onPress={() => router.replace(basePath as never)} className={`pb-2 ${!surEnvoyes ? "border-b-2 border-slate-900" : ""}`}>
        <Text className={`text-sm font-medium ${!surEnvoyes ? "text-slate-900" : "text-slate-500"}`}>
          Boîte de réception
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace(`${basePath}/envoyes` as never)}
        className={`pb-2 ${surEnvoyes ? "border-b-2 border-slate-900" : ""}`}
      >
        <Text className={`text-sm font-medium ${surEnvoyes ? "text-slate-900" : "text-slate-500"}`}>Envoyés</Text>
      </Pressable>
    </View>
  );
}
