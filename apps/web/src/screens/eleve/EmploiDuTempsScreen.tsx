import { SemainePlanning, useSemainePlanning } from "../../components/SemainePlanning";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasseEleve, useCreneaux, usePlanningSemaine, getAnneeScolaireActive } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { useExporterEmploiDuTemps } from "../../lib/useExporterEmploiDuTemps";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client, profile } = useAuth();
  const eleveId = useViewedEleveId();

  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });
  const anneeId = anneeQuery.data?.id;
  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId, anneeId],
    queryFn: () => getClasseEleve(client, eleveId!, anneeId),
    enabled: Boolean(eleveId && anneeId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;
  const creneauxQuery = useCreneaux(client, { classeId: classeId ?? undefined }, Boolean(classeId));

  const lundi = useSemainePlanning();
  const planning = usePlanningSemaine(client, creneauxQuery.data ?? [], lundi);
  const parJour = JOURS.map((_, i) => planning.seances.filter((c) => c.jour_semaine === i + 1));

  const exportIcs = useExporterEmploiDuTemps();

  function handleExporterIcs() {
    if (!classeId || !creneauxQuery.data || !anneeQuery.data) return;
    exportIcs.mutate({
      creneaux: creneauxQuery.data.map((c) => ({
        id: c.id,
        jour_semaine: c.jour_semaine,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        matiere: c.matiere_classe?.matieres?.nom ?? "Cours",
        detail: c.professeur ? `${c.professeur.prenom} ${c.professeur.nom}` : null,
      })),
      annee: anneeQuery.data,
    });
  }

  return (
    <div className="max-w-2xl">
      {profile?.role === "parent" && <ChildSwitcher />}
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Emploi du temps" description="Votre emploi du temps de la semaine." />
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
      {(planning.isError || anneeQuery.isError || classeQuery.isError || creneauxQuery.isError) && <p role="alert" className="text-sm text-red-700">Impossible de charger l’emploi du temps.</p>}
      {eleveId && (anneeQuery.isPending || (anneeId && classeQuery.isPending) || (classeId && (creneauxQuery.isPending || planning.isPending))) && (
        <p role="status" className="text-sm text-slate-600">Chargement de l’emploi du temps…</p>
      )}
      {anneeQuery.isSuccess && !anneeId && <p className="text-sm text-slate-600">Aucune année scolaire active.</p>}
      {eleveId && classeQuery.isSuccess && !classeId && <p className="text-sm text-slate-600">Aucune classe rattachée pour le moment.</p>}
      {classeId && creneauxQuery.isSuccess && !planning.isPending && !planning.isError && <div className="space-y-6">
        {JOURS.map((jour, i) => (
          <div key={jour}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{jour}</p>
            {parJour[i].length === 0 && <p className="text-sm text-slate-400">Aucun cours.</p>}
            <div className="space-y-2">
              {parJour[i].map((c) => (
                <Card key={c.id} className="p-3">
                  <p className="text-sm font-medium text-slate-900">{c.matiere_classe?.matieres?.nom}</p>
                  {c.annule && <p className="text-xs font-medium text-red-700">Séance annulée</p>}
                  {c.modifie && <p className="text-xs font-medium text-amber-800">Séance modifiée</p>}
                  {!c.annule && <p className="text-xs text-slate-500">
                    {c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}
                    {c.salle ? ` · Salle ${c.salle}` : ""}
                  </p>}
                  <p className="text-xs text-slate-400">{c.professeur?.prenom} {c.professeur?.nom}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
