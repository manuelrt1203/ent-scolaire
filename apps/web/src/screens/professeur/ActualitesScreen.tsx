import { useAuth, useActualites } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActualitesScreen() {
  const { client } = useAuth();
  const actualitesQuery = useActualites(client);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Actualités" description="Informations publiées par l'établissement." />
      <div className="space-y-3">
        {actualitesQuery.data?.map((a: any) => (
          <Card key={a.id} className="p-4">
            <p className="mb-1 text-sm font-medium text-slate-900">{a.titre}</p>
            <p className="mb-2 text-xs text-slate-400">{formatDate(a.created_at)}</p>
            <p className="text-sm text-slate-700">{a.contenu}</p>
          </Card>
        ))}
        {actualitesQuery.data?.length === 0 && <EmptyState message="Aucune actualité pour le moment." />}
      </div>
    </div>
  );
}
