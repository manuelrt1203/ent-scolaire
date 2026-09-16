import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasseEleve, useCreneaux } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Card, PageHeader } from "../../components/ui/Card";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function EmploiDuTempsScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;

  const creneauxQuery = useCreneaux(client, classeId ? { classeId } : undefined);

  const parJour = JOURS.map((_, i) => (creneauxQuery.data ?? []).filter((c: any) => c.jour_semaine === i + 1));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Emploi du temps" description="Votre emploi du temps de la semaine." />
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
