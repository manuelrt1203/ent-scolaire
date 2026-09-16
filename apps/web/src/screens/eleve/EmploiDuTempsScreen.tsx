import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasseEleve, useCreneaux, getAnneeScolaireActive, buildEmploiDuTempsIcs } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { telechargerFichierTexte } from "../../lib/telechargerFichier";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client, profile } = useAuth();
  const eleveId = useViewedEleveId();

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;

  const creneauxQuery = useCreneaux(client, classeId ? { classeId } : undefined);
  const anneeQuery = useQuery({
    queryKey: ["annee-active", profile?.etablissement_id],
    queryFn: () => getAnneeScolaireActive(client, profile!.etablissement_id),
    enabled: Boolean(profile),
  });

  const parJour = JOURS.map((_, i) => (creneauxQuery.data ?? []).filter((c: any) => c.jour_semaine === i + 1));

  function handleExporterIcs() {
    if (!creneauxQuery.data || !anneeQuery.data) return;
    const ics = buildEmploiDuTempsIcs(
      creneauxQuery.data.map((c: any) => ({
        id: c.id,
        jour_semaine: c.jour_semaine,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        matiere: c.matiere_classe?.matieres?.nom ?? "Cours",
        detail: c.professeur ? `${c.professeur.prenom} ${c.professeur.nom}` : null,
      })),
      anneeQuery.data,
    );
    telechargerFichierTexte(ics, "emploi-du-temps.ics", "text/calendar");
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Emploi du temps" description="Votre emploi du temps de la semaine." />
        <Button
          variant="secondary"
          onClick={handleExporterIcs}
          disabled={!creneauxQuery.data?.length || !anneeQuery.data}
        >
          Exporter (.ics)
        </Button>
      </div>
      <div className="space-y-6">
        {JOURS.map((jour, i) => (
          <div key={jour}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{jour}</p>
            {parJour[i].length === 0 && <p className="text-sm text-slate-400">Aucun cours.</p>}
            <div className="space-y-2">
              {parJour[i].map((c: any) => (
                <Card key={c.id} className="p-3">
                  <p className="text-sm font-medium text-slate-900">{c.matiere_classe?.matieres?.nom}</p>
                  <p className="text-xs text-slate-500">
                    {c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}
                    {c.salle ? ` · Salle ${c.salle}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">{c.professeur?.prenom} {c.professeur?.nom}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
