import { View } from "react-native";
import { TopNav } from "../../../components/TopNav";
import { InboxScreen } from "../../../components/screens/messagerie/InboxScreen";

export default function EleveInbox() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(eleve)" messagerieHref="/(eleve)/messagerie" />
      <InboxScreen basePath="/(eleve)/messagerie" />
    </View>
  );
}
