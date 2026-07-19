import { View } from "react-native";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { MobileAccueilScreen } from "../../components/MobileAccueilScreen";

export default function ParentIndex() {
  return (
    <View className="flex-1">
      <ChildSwitcher />
      <MobileAccueilScreen basePath="/(parent)" />
    </View>
  );
}
