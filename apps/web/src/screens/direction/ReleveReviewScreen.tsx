import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAuth,
  useReleveById,
  useNotesForReleve,
  useUpdateNoteValeur,
  useValiderReleve,
  useRejeterReleve,
  usePublierReleve,
  getStatutLabel,
} from "@ent/shared";

export function ReleveReviewScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useAuth();

  const releveQuery = useReleveById(client, id ?? null);
  const releve = releveQuery.data;
  const notesQuery = useNotesForReleve(client, id ?? null);
  const updateNote = useUpdateNoteValeur(client, id ?? null);
  const valider = useValiderReleve(client);
  const rejeter = useRejeterReleve(client);
  const publier = usePublierReleve(client);

  const [commentaire, setCommentaire] = useState("");

  const notes = notesQuery.data ?? [];
  const coefficient = releve?.matiere_classe?.coefficient ?? 1;

  // Aperçu informatif uniquement : la moyenne officielle reste calculée côté
  // base (calculer_moyenne_matiere) une fois le relevé validé/publié.
  const apercuMoyenne = useMemo(() => {
    const notees = notes.filter((n: any) => n.valeur !== null);
    if (notees.length === 0) return null;
    const sommePonderee = notees.reduce((acc: number, n: any) => acc + n.valeur * n.coefficient_note, 0);
    const sommeCoeff = notees.reduce((acc: number, n: any) => acc + n.coefficient_note, 0);
    return sommeCoeff > 0 ? sommePonderee / sommeCoeff : null;
  }, [notes]);

  if (!releve) return <p className="text-sm text-slate-500">Chargement…</p>;

  const isSoumise = releve.statut === "soumise";
  const isValidee = releve.statut === "validee";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 text-xs text-slate-500 underline">
        ← Retour
      </button>

      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        {releve.matiere_classe?.matieres?.nom} — {releve.matiere_classe?.classes?.nom}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {releve.periodes?.nom} · Coefficient {coefficient} · Statut : {getStatutLabel(releve.statut)}
      </p>

      {apercuMoyenne !== null && (
        <p className="mb-4 text-sm text-slate-600">
          Moyenne de classe (aperçu) : <span className="tabular-nums">{apercuMoyenne.toFixed(2)}/20</span>
        </p>
      )}

      <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Élève</th>
              <th className="px-4 py-2">Note / 20</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notes.map((n: any) => (
              <tr key={n.id}>
                <td className="px-4 py-2 text-slate-900">{n.profiles?.prenom} {n.profiles?.nom}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    disabled={!isSoumise}
                    defaultValue={n.valeur ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const valeur = raw === "" ? null : Number(raw);
                      if (valeur !== null && (Number.isNaN(valeur) || valeur < 0 || valeur > 20)) return;
                      updateNote.mutate({ noteId: n.id, valeur });
                    }}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSoumise && (
        <div className="space-y-3">
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Commentaire (requis en cas de rejet)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-3">
            <button
              onClick={() => valider.mutate({ releveId: releve.id, commentaire: commentaire || undefined })}
              disabled={valider.isPending}
              className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Valider
            </button>
            <button
              onClick={() => {
                if (!commentaire.trim()) return;
                rejeter.mutate({ releveId: releve.id, commentaire });
              }}
              disabled={rejeter.isPending || !commentaire.trim()}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
            >
              Rejeter (renvoyer au professeur)
            </button>
          </div>
        </div>
      )}

      {isValidee && (
        <button
          onClick={() => publier.mutate(releve.id)}
          disabled={publier.isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Publier aux élèves et parents
        </button>
      )}
    </div>
  );
}
