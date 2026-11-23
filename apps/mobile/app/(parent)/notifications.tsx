import { NotificationsScreen } from "../../components/screens/notifications/NotificationsScreen";
import { useParentChild } from "../../lib/ParentChildContext";

export default function ParentNotifications() {
  const { enfants, setSelectedId } = useParentChild();
  return <NotificationsScreen espace="parent" choisirEnfant={(id) => {
    if (!enfants.some((enfant) => enfant.id === id)) return false;
    setSelectedId(id);
    return true;
  }} />;
}
