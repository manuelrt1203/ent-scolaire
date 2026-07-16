import { useAuth, useActualites } from "@ent/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActualitesScreen() {
  const { client } = useAuth();
  const actualitesQuery = useActualites(client);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Actualités</h1>
      <div className="space-y-3">
        {actualitesQuery.data?.map((a: any) => (
          <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-1 text-sm font-medium text-slate-900">{a.titre}</p>
            <p className="mb-2 text-xs text-slate-400">{formatDate(a.created_at)}</p>
            <p className="text-sm text-slate-700">{a.contenu}</p>
          </div>
        ))}
        {actualitesQuery.data?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Aucune actualité pour le moment.</p>
        )}
      </div>
    </div>
  );
}
