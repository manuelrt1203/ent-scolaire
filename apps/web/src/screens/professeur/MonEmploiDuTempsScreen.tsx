import { SemainePlanning, useSemainePlanning } from "../../components/SemainePlanning";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useCreneaux, usePlanningSemaine, dateCreneauSemaine, getAnneeScolaireActive } from "@ent/shared";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { AppelSeance } from "./AppelSeance";
import { useExporterEmploiDuTemps } from "../../lib/useExporterEmploiDuTemps";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function MonEmploiDuTempsScreen() {
  const { client, profile } = useAuth();
  const creneauxQuery = useCreneaux(client);
  const lundi = useSemainePlanning();
  const planning = usePlanningSemaine(client, creneauxQuery.data ?? [], lundi);
  const [parametres, setParametres] = useSearchParams();
  const creneauAppel = creneauxQuery.data?.find(({ id, professeur_id }) =>
    id === parametres.get("appel") && professeur_id === profile?.id
  );

  function afficherAppel(id: string | null) {
    setParametres((actuels) => {
      const suivants = new URLSearchParams(actuels);
      if (id) suivants.set("appel", id);
      else suivants.delete("appel");
      return suivants;
    });
  }
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const exportIcs = useExporterEmploiDuTemps();

  function handleExporterIcs() {
    if (!creneauxQuery.data || !anneeQuery.data) return;
    exportIcs.mutate({
      creneaux: creneauxQuery.data.map((c) => ({
        id: c.id,
        jour_semaine: c.jour_semaine,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        matiere: c.matiere_classe?.matieres?.nom ?? "Cours",
        detail: c.matiere_classe?.classes?.nom,
      })),
      annee: anneeQuery.data,
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Mon emploi du temps" description="Votre emploi du temps de la semaine." />
        <Button
          variant="secondary"
          onClick={handleExporterIcs}
          disabled={!creneauxQuery.data?.length || !anneeQuery.data || exportIcs.isPending}
        >
          {exportIcs.isPending ? "Export en cours…" : "Exporter (.ics)"}
        </Button>
      </div>
      {exportIcs.isError && <p role="alert" className="mb-3 text-sm text-red-700">Impossible d’exporter l’emploi du temps. Réessayez.</p>}
      <SemainePlanning lundi={lundi} />
      {creneauAppel && (
        <AppelSeance key={`${creneauAppel.id}-${lundi}`} creneau={creneauAppel}
          dateInitiale={dateCreneauSemaine(lundi, creneauAppel.jour_semaine)}
          jour={JOURS[creneauAppel.jour_semaine - 1]} fermer={() => afficherAppel(null)} />
      )}
      <Card className="overflow-x-auto">
        {creneauxQuery.isError || planning.isError ? (
          <EmptyState message="Impossible de charger l’emploi du temps." />
        ) : creneauxQuery.isPending || planning.isPending ? (
          <EmptyState message="Chargement de l’emploi du temps…" />
        ) : planning.seances.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Jour</th>
                <th className="px-4 py-2">Horaire</th>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Salle</th>
                <th className="px-4 py-2">Appel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {planning.seances.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                  <td className="px-4 py-2 text-slate-500">{c.annule ? <span className="font-medium text-red-700">Séance annulée</span> : `${c.heure_debut.slice(0, 5)} – ${c.heure_fin.slice(0, 5)}`}
                    {c.modifie && <span className="block text-xs text-amber-800">Séance modifiée</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{(c.annule ? null : c.salle) ?? "—"}</td>
                  <td className="px-4 py-2">
                    {!c.annule && c.professeur_id === profile?.id && (
                      <Button variant="secondary" className="whitespace-nowrap" onClick={() => afficherAppel(c.id)}>
                        Faire l’appel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun créneau renseigné." />
        )}
      </Card>
    </div>
  );
}
