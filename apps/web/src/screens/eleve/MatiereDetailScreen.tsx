import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth, useNotesEleveMatiere } from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { Card, EmptyState } from "../../components/ui/Card";

export function MatiereDetailScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const eleveId = useViewedEleveId();
  const { matiereClasseId } = useParams<{ matiereClasseId: string }>();
  const [searchParams] = useSearchParams();
  const periodeId = searchParams.get("periodeId");

  const notesQuery = useNotesEleveMatiere(client, eleveId, matiereClasseId ?? null, periodeId);

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-6 text-xs text-slate-500 hover:text-ent-accent hover:underline">
        ← Retour
      </button>
      <div className="space-y-2">
        {notesQuery.data?.map((n: any) => (
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
