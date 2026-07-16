import { useAuth, useEvenementsCalendrier } from "@ent/shared";

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CalendrierScreen() {
  const { client } = useAuth();
  const evenementsQuery = useEvenementsCalendrier(client);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Calendrier</h1>
      <div className="space-y-3">
        {evenementsQuery.data?.map((e: any) => (
          <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-1 text-sm font-medium text-slate-900">{e.titre}</p>
            <p className="mb-2 text-xs text-slate-400">
              {formatDateHeure(e.date_debut)} – {formatDateHeure(e.date_fin)}
              {e.lieu && ` · ${e.lieu}`}
            </p>
            {e.description && <p className="text-sm text-slate-700">{e.description}</p>}
          </div>
        ))}
        {evenementsQuery.data?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Aucun événement au calendrier.</p>
        )}
      </div>
    </div>
  );
}
