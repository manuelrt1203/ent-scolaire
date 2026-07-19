import { useAuth, useMesAffectations } from "@ent/shared";

export function MesClassesScreen() {
  const { client } = useAuth();
  const affectationsQuery = useMesAffectations(client);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Mes classes</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Matière</th>
              <th className="px-4 py-2">Classe</th>
              <th className="px-4 py-2">Coefficient</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {affectationsQuery.data?.map((a: any) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-slate-900">{a.matiere_classe?.matieres?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.classes?.nom}</td>
                <td className="px-4 py-2 text-slate-500">{a.matiere_classe?.coefficient}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
