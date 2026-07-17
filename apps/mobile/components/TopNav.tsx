import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@ent/shared";

const LIENS: { label: string; segment: string }[] = [
  { label: "Notes", segment: "" },
  { label: "Emploi du temps", segment: "/emploi-du-temps" },
  { label: "Vie scolaire", segment: "/vie-scolaire" },
  { label: "Cahier de textes", segment: "/cahier-textes" },
  { label: "Ressources", segment: "/ressources" },
  { label: "Actualités", segment: "/actualites" },
  { label: "Calendrier", segment: "/calendrier" },
  { label: "Annuaire", segment: "/annuaire" },
  { label: "Messagerie", segment: "/messagerie" },
];

export function TopNav({ basePath }: { basePath: string }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <SafeAreaView edges={["top"]} className="border-b border-slate-200 bg-white">
      <View className="flex-row items-center justify-between px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row items-center gap-4">
          {LIENS.map((lien) => (
            <Pressable key={lien.segment} onPress={() => router.push(`${basePath}${lien.segment}` as never)}>
              <Text className="text-sm font-medium text-slate-700">{lien.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View className="flex-row items-center justify-end gap-3 px-4 pb-1">
        <Text className="text-xs text-slate-400">{profile?.prenom}</Text>
        <Pressable onPress={handleSignOut}>
          <Text className="text-xs text-slate-400">Déconnexion</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
