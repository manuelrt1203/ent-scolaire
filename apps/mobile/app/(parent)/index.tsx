import { View } from "react-native";
import { TopNav } from "../../components/TopNav";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { NotesScreen } from "../../components/screens/notes/NotesScreen";

export default function ParentIndex() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(parent)" messagerieHref="/(parent)/messagerie" />
      <ChildSwitcher />
      <NotesScreen />
    </View>
  );
}
