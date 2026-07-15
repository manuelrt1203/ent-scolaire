import { View } from "react-native";
import { TopNav } from "../../../components/TopNav";
import { InboxScreen } from "../../../components/screens/messagerie/InboxScreen";

export default function ParentInbox() {
  return (
    <View className="flex-1">
      <TopNav notesHref="/(parent)" messagerieHref="/(parent)/messagerie" />
      <InboxScreen basePath="/(parent)/messagerie" />
    </View>
  );
}
