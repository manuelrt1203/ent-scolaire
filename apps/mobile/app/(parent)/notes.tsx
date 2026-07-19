import { View } from "react-native";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { NotesScreen } from "../../components/screens/notes/NotesScreen";

export default function ParentNotes() {
  return (
    <View className="flex-1">
      <ChildSwitcher />
      <NotesScreen />
    </View>
  );
}
