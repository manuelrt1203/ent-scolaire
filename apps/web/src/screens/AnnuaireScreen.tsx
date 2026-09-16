import { useQuery } from "@tanstack/react-query";
import { useAuth, getAnnuaireMessagerie } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../components/ui/Card";

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
      <PageHeader title="Annuaire" description="Coordonnées de tous les membres de l'établissement." />

      {ROLE_ORDER.filter((role) => (parRole[role]?.length ?? 0) > 0).map((role) => (
        <div key={role} className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase text-slate-500">{ROLE_LABELS[role]}</h2>
          <Card className="overflow-x-auto">
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
          </Card>
        </div>
      ))}

      {annuaireQuery.data?.length === 0 && <EmptyState message="Annuaire vide." />}
    </div>
  );
}
