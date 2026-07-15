import { View, Text, ScrollView, Pressable } from "react-native";
import { useParentChild } from "../lib/ParentChildContext";

export function ChildSwitcher() {
  const { enfants, selectedId, setSelectedId } = useParentChild();

  if (enfants.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="h-14 flex-none border-b border-slate-200 bg-white"
      contentContainerClassName="flex-row items-center px-4"
    >
      {enfants.map((e) => (
        <Pressable
          key={e.id}
          onPress={() => setSelectedId(e.id)}
          className={`mr-2 self-center rounded-full px-3 py-1.5 ${e.id === selectedId ? "bg-slate-900" : "bg-slate-100"}`}
        >
          <Text className={`text-sm ${e.id === selectedId ? "text-white" : "text-slate-600"}`}>
            {e.prenom} {e.nom}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
