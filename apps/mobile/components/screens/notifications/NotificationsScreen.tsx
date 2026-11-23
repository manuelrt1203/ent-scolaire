import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth, useMarquerNotificationCommeLue, useMarquerToutesNotificationsCommeLues, useNotifications } from "@ent/shared";
import { NAV } from "../../nav";

export function NotificationsScreen({ espace, choisirEnfant }: {
  espace: "eleve" | "parent";
  choisirEnfant?: (id: string) => boolean;
}) {
  const { client } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notifications = useNotifications(client);
  const marquerLue = useMarquerNotificationCommeLue(client);
  const toutMarquer = useMarquerToutesNotificationsCommeLues(client);
  const [erreurLien, setErreurLien] = useState("");

  function ouvrir(notification: { id: string; lien: string | null; lu: boolean }) {
    setErreurLien("");
    if (!notification.lu) marquerLue.mutate(notification.id);
    if (!notification.lien) return;

    const [chemin, recherche = ""] = notification.lien.split("?");
    const destination = NAV.find(({ segment }) => chemin === `/${espace}${segment}`);
    if (!destination) return;

    const params = new URLSearchParams(recherche);
    const enfant = params.get("enfant");
    if (enfant && choisirEnfant && !choisirEnfant(enfant)) {
      setErreurLien("Le dossier de cet enfant n’est plus accessible.");
      return;
    }
    const pathname = `/(${espace})${destination.segment}` as never;
    const semaine = destination.segment === "/emploi-du-temps" ? params.get("semaine") : null;
    if (semaine) void queryClient.invalidateQueries({ queryKey: ["exceptions-creneaux"] });
    router.push(semaine ? { pathname, params: { semaine } } : pathname);
  }

  return (
    <FlatList
      className="flex-1 bg-slate-50"
      contentContainerClassName="px-4 py-4"
      data={notifications.data ?? []}
      keyExtractor={({ id }) => id}
      refreshing={notifications.isRefetching}
      onRefresh={() => notifications.refetch()}
      ListHeaderComponent={
        <View className="mb-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xl font-semibold text-midnight-ink">Notifications</Text>
            {notifications.data?.some(({ lu }) => !lu) && (
              <Pressable accessibilityRole="button" disabled={toutMarquer.isPending} onPress={() => toutMarquer.mutate()}>
                <Text className="py-2 text-sm font-medium text-teal-800">Tout marquer comme lu</Text>
              </Pressable>
            )}
          </View>
          {(erreurLien || notifications.isError || marquerLue.isError || toutMarquer.isError) && (
            <Text accessibilityRole="alert" className="mt-2 text-sm text-red-700">
              {erreurLien || (notifications.isError ? "Impossible de charger les notifications." : "Impossible de marquer la notification comme lue.")}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text className="text-center text-sm text-slate-600">
          {notifications.isPending ? "Chargement…" : notifications.isSuccess ? "Aucune notification." : ""}
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => ouvrir(item)}
          className={`mb-2 rounded-xl border p-4 ${item.lu ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50"}`}
        >
          <Text className="text-sm font-semibold text-midnight-ink">{item.titre}</Text>
          {item.contenu && <Text className="mt-1 text-sm text-slate-700">{item.contenu}</Text>}
          {!item.lu && <Text className="mt-2 text-xs font-medium text-teal-800">Non lue</Text>}
        </Pressable>
      )}
    />
  );
}
