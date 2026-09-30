import { useAuth, useEvenementsCalendrier } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { DatesOfficielles } from "../../components/calendrier/DatesOfficielles";

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CalendrierScreen() {
  const { client } = useAuth();
  const evenementsQuery = useEvenementsCalendrier(client);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Calendrier" description="Événements et dates clés de l'année." />

      <DatesOfficielles />
      <div className="space-y-3">
        {evenementsQuery.data?.map((e: any) => (
          <Card key={e.id} className="p-4">
            <p className="mb-1 text-sm font-medium text-slate-900">{e.titre}</p>
            <p className="mb-2 text-xs text-slate-400">
              {formatDateHeure(e.date_debut)} – {formatDateHeure(e.date_fin)}
              {e.lieu ? ` · ${e.lieu}` : ""}
            </p>
            {e.description && <p className="text-sm text-slate-700">{e.description}</p>}
          </Card>
        ))}
        {evenementsQuery.data?.length === 0 && <EmptyState message="Aucun événement au calendrier." />}
      </div>
    </div>
  );
}
