import { Link, useSearchParams } from "react-router-dom";
import { useAuth, useRelevesForDirection, getStatutLabel, libelleClasse } from "@ent/shared";
import { SuiviRelevesClasse } from "../../components/SuiviRelevesClasse";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

export function RelevesAValiderScreen() {
  const { client } = useAuth();
  const [filtres, setFiltres] = useSearchParams();
  const periode = filtres.get("periode");
  const classe = periode ? filtres.get("classe") : null;
  const statut = filtres.get("statut");
  const statutActif = statut === "soumise" || statut === "validee" ? statut : "";
  const relevesQuery = useRelevesForDirection(client, ["soumise", "validee"]);

  const releves = (relevesQuery.data ?? []).filter((releve) =>
    (!periode || releve.periode_id === periode)
    && (!classe || releve.matiere_classe?.classe_id === classe)
  );
  const visibles = statutActif ? releves.filter(({ statut }) => statut === statutActif) : releves;
  const options = [
    { valeur: "", libelle: "Tous", total: releves.length },
    { valeur: "soumise", libelle: "À valider", total: releves.filter(({ statut }) => statut === "soumise").length },
    { valeur: "validee", libelle: "À publier", total: releves.filter(({ statut }) => statut === "validee").length },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader title="Relevés à examiner" description="Valider et publier les relevés de notes." />

      <SuiviRelevesClasse />
      <h2 className="mb-3 text-lg font-semibold text-midnight-ink">Relevés en attente de traitement</h2>
      <div role="group" aria-label="Statut des relevés" className="mb-3 flex flex-wrap gap-2">
        {options.map(({ valeur, libelle, total }) => (
          <button
            key={libelle}
            type="button"
            aria-pressed={statutActif === valeur}
            onClick={() => setFiltres((actuels) => {
              const suivants = new URLSearchParams(actuels);
              if (valeur) suivants.set("statut", valeur);
              else suivants.delete("statut");
              return suivants;
            }, { replace: true })}
            className={`rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${
              statutActif === valeur ? "border-ent-accent bg-ent-tint text-ent-accent" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {libelle}{relevesQuery.isSuccess && <span className="ml-2 tabular-nums">{" "}{total}</span>}
          </button>
        ))}
      </div>
      <Card className="overflow-x-auto">
        {relevesQuery.isError ? (
          <p role="alert" className="p-4 text-sm text-red-700">Impossible de charger les relevés en attente.</p>
        ) : relevesQuery.isPending ? (
          <p role="status" className="p-4 text-sm text-slate-600">Chargement des relevés…</p>
        ) : visibles.length ? (
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
              {visibles.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-900">{r.matiere_classe?.matieres?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{libelleClasse(r.matiere_classe?.classes)}</td>
                  <td className="px-4 py-2 text-slate-500">{r.periodes?.nom}</td>
                  <td className="px-4 py-2 text-slate-500">{getStatutLabel(r.statut)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={{ pathname: `/direction/releves/${r.id}`, search: filtres.toString() }} className="text-sm font-medium text-ent-accent underline">
                      Examiner
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message={periode || statutActif ? "Aucun relevé ne correspond aux filtres." : "Aucun relevé en attente."} />
        )}
      </Card>
    </div>
  );
}
