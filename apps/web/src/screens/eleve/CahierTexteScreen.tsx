import { useQuery } from "@tanstack/react-query";
import { useAuth, getClasseEleve, useCahierTexteClasse } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function CahierTexteScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });
  const classeId = classeQuery.data?.classe_id ?? null;

  const cahierQuery = useCahierTexteClasse(client, classeId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Cahier de textes" description="Contenu des séances par matière." />
      <div className="space-y-3">
        {cahierQuery.data?.map((entree: any) => (
          <Card key={entree.id} className="p-4">
            <p className="mb-1 text-sm font-medium text-slate-900">
              {formatDate(entree.date_seance)} — {entree.matiere_classe?.matieres?.nom}
            </p>
            {entree.contenu_seance && <p className="mb-1 text-sm text-slate-700">{entree.contenu_seance}</p>}
            {entree.travail_a_faire && (
              <p className="text-sm text-slate-600">
                Travail à faire : {entree.travail_a_faire}
                {entree.date_echeance ? ` (pour le ${formatDate(entree.date_echeance)})` : ""}
              </p>
            )}
          </Card>
        ))}
        {cahierQuery.data?.length === 0 && <EmptyState message="Aucune entrée pour le moment." />}
      </div>
    </div>
  );
}
