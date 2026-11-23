import { useQuery } from "@tanstack/react-query";
import { View, Text, ScrollView } from "react-native";
import { useAuth, getAnneeScolaireActive, getClasseEleve, useCreneaux } from "@ent/shared";
import { useViewedEleveId } from "../../../lib/ViewedEleveContext";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client, profile } = useAuth();
  const eleveId = useViewedEleveId();

  const annee = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });
  const anneeId = annee.data?.id;
  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId, anneeId],
    queryFn: () => getClasseEleve(client, eleveId!, anneeId),
    enabled: Boolean(eleveId && anneeId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;
  const creneauxQuery = useCreneaux(client, { classeId: classeId ?? undefined }, Boolean(classeId));

  const parJour = JOURS.map((_, i) =>
    (creneauxQuery.data ?? []).filter((c) => c.jour_semaine === i + 1),
  );

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 py-4">
      <Text className="mb-4 text-lg font-semibold text-slate-900">Emploi du temps</Text>
      {(annee.isError || classeQuery.isError || creneauxQuery.isError) && (
        <Text accessibilityRole="alert" className="text-sm text-red-700">Impossible de charger l’emploi du temps.</Text>
      )}
      {eleveId && (annee.isPending || (anneeId && classeQuery.isPending) || (classeId && creneauxQuery.isPending)) && (
        <Text className="text-sm text-slate-600">Chargement…</Text>
      )}
      {annee.isSuccess && !anneeId && <Text className="text-sm text-slate-600">Aucune année scolaire active.</Text>}
      {classeQuery.isSuccess && !classeId && <Text className="text-sm text-slate-600">Aucune classe rattachée pour le moment.</Text>}
      {classeId && creneauxQuery.isSuccess && JOURS.map((jour, i) => (
        <View key={jour} className="mb-4">
          <Text className="mb-2 text-xs font-medium uppercase text-slate-500">{jour}</Text>
          {parJour[i].length === 0 && <Text className="text-sm text-slate-400">Aucun cours.</Text>}
          {parJour[i].map((c) => (
            <View key={c.id} className="mb-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <Text className="text-sm font-medium text-slate-900">{c.matiere_classe?.matieres?.nom}</Text>
              <Text className="text-xs text-slate-500">
                {c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}
                {c.salle ? ` · Salle ${c.salle}` : ""}
              </Text>
              <Text className="text-xs text-slate-400">{c.professeur?.prenom} {c.professeur?.nom}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
