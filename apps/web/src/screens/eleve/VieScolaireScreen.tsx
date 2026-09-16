import { useAuth, useVieScolaireEleve } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

const TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  sanction: "Sanction",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function VieScolaireScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();
  const vieScolaireQuery = useVieScolaireEleve(client, eleveId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Vie scolaire" description="Absences, retards et sanctions." />
      <div className="space-y-3">
        {vieScolaireQuery.data?.map((v: any) => (
          <Card key={v.id} className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{TYPE_LABELS[v.type]}</span>
              <span className="text-xs text-slate-400">{formatDate(v.date)}</span>
            </div>
            {v.type === "sanction" && v.description && <p className="text-sm text-slate-700">{v.description}</p>}
            {v.type === "retard" && v.duree_minutes != null && <p className="text-sm text-slate-700">{v.duree_minutes} min</p>}
            {v.type !== "sanction" && (
              <p className={`mt-1 text-xs ${v.justifie ? "text-emerald-600" : "text-amber-600"}`}>
                {v.justifie ? "Justifié" : "Non justifié"}
                {v.motif ? ` · ${v.motif}` : ""}
              </p>
            )}
          </Card>
        ))}
        {vieScolaireQuery.data?.length === 0 && <EmptyState message="Aucun événement de vie scolaire." />}
      </div>
    </div>
  );
}
