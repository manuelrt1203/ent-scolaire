import { View } from "react-native";
import { TopNav } from "../../components/TopNav";
import { NotesScreen } from "../../components/screens/notes/NotesScreen";

export default function EleveIndex() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(eleve)" messagerieHref="/(eleve)/messagerie" />
      <NotesScreen />
    </View>
  );
}
