import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth, useNotesEleveMatiere } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Card, EmptyState } from "../../components/ui/Card";

export function MatiereDetailScreen() {
  const { client } = useAuth();
  const eleveId = useViewedEleveId();
  const { matiereClasseId } = useParams<{ matiereClasseId: string }>();
  const [searchParams] = useSearchParams();
  const periodeId = searchParams.get("periodeId");

  const notesQuery = useNotesEleveMatiere(client, eleveId, matiereClasseId ?? null, periodeId);

  return (
    <div className="max-w-2xl">
      <Link
        to={{ pathname: "../notes", search: periodeId ? new URLSearchParams({ periode: periodeId }).toString() : "" }}
        className="mb-6 inline-block text-sm font-semibold text-ent-accent hover:underline"
      >
        ← Retour aux notes
      </Link>
      {!periodeId && <EmptyState message="Choisissez une période dans vos notes pour consulter cette matière." />}
      {notesQuery.isError && <p role="alert" className="text-sm text-red-700">Impossible de charger les notes de cette matière.</p>}
      {eleveId && periodeId && notesQuery.isPending && <p role="status" className="text-sm text-slate-600">Chargement des notes…</p>}
      <div className="space-y-2">
        {notesQuery.data?.map((n) => (
          <Card key={n.id} className="flex items-center justify-between p-4">
            <span className="text-sm text-slate-700">{n.libelle ?? "Note"}</span>
            <span className="text-base font-semibold tabular-nums text-slate-900">
              {n.valeur !== null ? `${Number(n.valeur).toFixed(2)}/20` : "—"}
            </span>
          </Card>
        ))}
        {notesQuery.data?.length === 0 && <EmptyState message="Aucune note publiée pour cette matière." />}
      </div>
    </div>
  );
}
