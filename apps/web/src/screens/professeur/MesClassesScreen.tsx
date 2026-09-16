import { useAuth, useMesAffectations } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

export function MesClassesScreen() {
  const { client } = useAuth();
  const affectationsQuery = useMesAffectations(client);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Mes classes" description="Vos matières et classes affectées pour l'année en cours." />
      <Card className="overflow-x-auto">
        {affectationsQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Matière</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Coefficient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affectationsQuery.data.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-slate-900">{a.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.classes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.coefficient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Aucune affectation pour le moment." />
        )}
      </Card>
    </div>
  );
}
