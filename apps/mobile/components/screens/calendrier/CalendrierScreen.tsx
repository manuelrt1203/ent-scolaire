import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { formatDateOfficielle, useAuth, useDatesOfficielles, useEvenementsCalendrier, useEtablissementCalendrier, formatDateHeureCalendrier } from "@ent/shared";

const APERCU = 5;

/** Vacances scolaires + jours fériés à venir, en lecture seule, au-dessus des événements. */
function DatesOfficielles() {
  const { client, profile } = useAuth();
  const { data, isLoading, isError, academie, academieChargee, calendrierOfficielFrance } = useDatesOfficielles(client, profile);
  const [toutVoir, setToutVoir] = useState(false);

  if (!calendrierOfficielFrance || isLoading || !academieChargee || isError) return null;
  const dates = toutVoir ? data ?? [] : (data ?? []).slice(0, APERCU);

  return (
    <View className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <Text className="text-sm font-semibold text-slate-900">Vacances et jours fériés</Text>
      <Text className="mb-2 text-xs text-slate-400">
        {academie ? `Académie de ${academie}` : "Jours fériés uniquement (académie non renseignée)"}
      </Text>
      {dates.map((d) => (
        <View key={d.id} className="flex-row items-start border-t border-slate-100 py-2">
          <View className={`mr-3 mt-1.5 h-2 w-2 rounded-full ${d.type === "vacances" ? "bg-emerald-500" : "bg-amber-500"}`} />
          <View className="flex-1">
            <Text className="text-sm text-slate-900">{d.titre}</Text>
            <Text className="text-xs text-slate-500">{formatDateOfficielle(d)}</Text>
          </View>
        </View>
      ))}
      {(data?.length ?? 0) > APERCU && (
        <Pressable onPress={() => setToutVoir((v) => !v)} className="pt-2">
          <Text className="text-xs font-medium text-indigo-ink">
            {toutVoir ? "Réduire" : `Afficher les ${data!.length} dates de l'année`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function CalendrierScreen() {
  const { client, profile } = useAuth();
  const { pays } = useEtablissementCalendrier(client, profile);
  const evenementsQuery = useEvenementsCalendrier(client);

  return (
    <FlatList
      className="flex-1 bg-slate-50 px-4 py-4"
      data={evenementsQuery.data ?? []}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={
        <>
          <Text className="mb-4 text-lg font-semibold text-slate-900">Calendrier</Text>
          <DatesOfficielles />
        </>
      }
      ListEmptyComponent={<Text className="mt-8 text-center text-sm text-slate-400">Aucun événement au calendrier.</Text>}
      renderItem={({ item: e }: { item: any }) => (
        <View className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Text className="mb-1 text-sm font-medium text-slate-900">{e.titre}</Text>
          <Text className="mb-2 text-xs text-slate-400">
            {formatDateHeureCalendrier(e.date_debut, pays, false)} – {formatDateHeureCalendrier(e.date_fin, pays, false)}
            {e.lieu ? ` · ${e.lieu}` : ""}
          </Text>
          {e.description && <Text className="text-sm text-slate-700">{e.description}</Text>}
        </View>
      )}
    />
  );
}
