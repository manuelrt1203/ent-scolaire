import { Link } from "react-router-dom";
import { useAuth, useRelevesForDirection, getStatutLabel } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

export function RelevesAValiderScreen() {
  const { client } = useAuth();
  const relevesQuery = useRelevesForDirection(client, ["soumise", "validee"]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Relevés à examiner" description="Valider et publier les relevés de notes." />

      <Card className="overflow-x-auto">
        {relevesQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Période</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relevesQuery.data.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-900">{r.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{r.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{r.periodes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{getStatutLabel(r.statut)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/direction/releves/${r.id}`} className="text-sm font-medium text-indigo-ink underline">
                      Examiner
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucun relevé en attente." />
        )}
      </Card>
    </div>
  );
}
