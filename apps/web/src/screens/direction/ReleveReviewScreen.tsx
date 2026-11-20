import { useMemo, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { aDesEvaluationsLycee, EvaluationsLycee } from "../../components/EvaluationsLycee";
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
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Field";

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
  const evaluationsLycee = notes.some(aDesEvaluationsLycee);
  const enregistrementEvaluations = useIsMutating({ mutationKey: ["evaluations-lycee", id] }) > 0;
  const transitionEnCours = valider.isPending || rejeter.isPending || publier.isPending;
  const erreur = notesQuery.error ?? updateNote.error ?? valider.error ?? rejeter.error ?? publier.error;
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
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>← Retour</Button>

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

      {erreur && <p role="alert" className="mb-4 text-sm text-red-700">{erreur.message}</p>}
      <Card className="mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Élève</th>
              {evaluationsLycee && <th className="px-4 py-2">Évaluations sur 20</th>}
              <th className="px-4 py-2">Note / 20</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notes.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2 text-slate-900">{n.profiles?.prenom} {n.profiles?.nom}</td>
                {evaluationsLycee && (
                  <td className="px-4 py-2">
                    {aDesEvaluationsLycee(n) && (
                      <EvaluationsLycee key={n.updated_at} note={n} editable={isSoumise} disabled={transitionEnCours} complete />
                    )}
                  </td>
                )}
                <td className="px-4 py-2">
                  {aDesEvaluationsLycee(n) ? (n.valeur ?? "—") : <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    disabled={!isSoumise || transitionEnCours}
                    defaultValue={n.valeur ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const valeur = raw === "" ? null : Number(raw);
                      if (valeur !== null && (Number.isNaN(valeur) || valeur < 0 || valeur > 20)) return;
                      if (valeur !== n.valeur) updateNote.mutate({ noteId: n.id, valeur });
                    }}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {isSoumise && (
        <div className="space-y-3">
          <Textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Commentaire (requis en cas de rejet)"
            rows={2}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => valider.mutate({ releveId: releve.id, commentaire: commentaire || undefined })}
              disabled={transitionEnCours || enregistrementEvaluations || updateNote.isPending || notes.some((note) => aDesEvaluationsLycee(note) && note.valeur === null)}
            >
              Valider
            </Button>
            <Button
              variant="danger-outline"
              onClick={() => {
                if (!commentaire.trim()) return;
                rejeter.mutate({ releveId: releve.id, commentaire });
              }}
              disabled={transitionEnCours || enregistrementEvaluations || updateNote.isPending || !commentaire.trim()}
            >
              Rejeter (renvoyer au professeur)
            </Button>
          </div>
        </div>
      )}

      {isValidee && (
        <Button variant="success" onClick={() => publier.mutate(releve.id)} disabled={publier.isPending}>
          Publier aux élèves et parents
        </Button>
      )}
    </div>
  );
}
