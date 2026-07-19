import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie } from "@ent/shared";

const ROLE_LABELS: Record<string, string> = {
  direction: "Direction",
  professeur: "Professeurs",
  eleve: "Élèves",
  parent: "Parents",
};

const ROLE_ORDER = ["direction", "professeur", "eleve", "parent"];

export function AnnuaireScreen() {
  const { client } = useAuth();
  const annuaireQuery = useQuery({ queryKey: ["annuaire"], queryFn: () => getAnnuaireMessagerie(client) });

  const parRole = (annuaireQuery.data ?? []).reduce<Record<string, typeof annuaireQuery.data>>((acc, p: any) => {
    (acc[p.role] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Annuaire</h1>

      {ROLE_ORDER.filter((role) => (parRole[role]?.length ?? 0) > 0).map((role) => (
        <div key={role} className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase text-slate-500">{ROLE_LABELS[role]}</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {parRole[role]!.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-slate-900">{p.prenom} {p.nom}</td>
                    <td className="px-4 py-2 text-slate-500">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {annuaireQuery.data?.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Annuaire vide.</p>}
    </div>
  );
}
