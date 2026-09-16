import { useAuth, useCreneaux } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function MonEmploiDuTempsScreen() {
  const { client } = useAuth();
  const creneauxQuery = useCreneaux(client);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Mon emploi du temps" description="Votre emploi du temps de la semaine." />
      <Card className="overflow-x-auto">
        {creneauxQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Jour</th>
                <th className="px-4 py-2">Horaire</th>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Salle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creneauxQuery.data.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-slate-900">{JOURS[c.jour_semaine - 1]}</td>
                  <td className="px-4 py-2 text-slate-500">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{c.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{c.salle ?? "—"}</td>
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
