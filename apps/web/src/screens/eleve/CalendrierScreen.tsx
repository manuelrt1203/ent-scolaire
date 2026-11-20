import { useAuth, useEvenementsCalendrier, useEtablissementCalendrier, formatDateHeureCalendrier } from "@ent/shared";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";
import { DatesOfficielles } from "../../components/calendrier/DatesOfficielles";

export function CalendrierScreen() {
  const { client, profile } = useAuth();
  const { pays, fuseau } = useEtablissementCalendrier(client, profile);
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
              {formatDateHeureCalendrier(e.date_debut, pays, true, fuseau?.identifiant)} – {formatDateHeureCalendrier(e.date_fin, pays, true, fuseau?.identifiant)}
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
